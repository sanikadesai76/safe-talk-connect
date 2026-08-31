/**
 * Targeted tests for SafeTalk critical backend logic.
 *
 * Tests cover security and correctness paths:
 * 1. createReport participant guard
 * 2. sendMessage participant guard
 * 3. getMessages participant guard
 * 4. endConversation participant guard
 * 5. Listener matching with blocks
 * 6. getMyActiveConversation role awareness
 * 7. setFirstAdmin auth + role guard
 * 8. Ratings submission constraints
 * 9. Admin authorization checks
 * 10. Listener availability restrictions
 * 11. Listener profile dedup
 * 12. Role selection dedup
 * 13. Seed idempotency
 * 14. Block idempotency
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Fake ID generator ────────────────────────────────────────────────
let idCounter = 0;
function fakeId(table: string): string {
  return `#${table}:${++idCounter}`;
}

// ─── In-memory stores ─────────────────────────────────────────────────
type Doc = Record<string, unknown>;
type Store = Record<string, Doc>;
const stores: Record<string, Store> = {};

function clearAllStores() {
  idCounter = 0;
  for (const key of Object.keys(stores)) delete stores[key];
}

function insertRow(table: string, doc: Doc): string {
  const id = fakeId(table);
  stores[table] = stores[table] || {};
  stores[table][id] = { _id: id, _creationTime: Date.now(), ...doc };
  return id;
}

function getRow(table: string, id: string): Doc | null {
  return stores[table]?.[id] ?? null;
}

function patchRow(table: string, id: string, updates: Doc) {
  if (stores[table]?.[id]) Object.assign(stores[table][id], updates);
}

function allRows(table: string): Doc[] {
  return Object.values(stores[table] || {});
}

function countRows(table: string): number {
  return Object.keys(stores[table] || {}).length;
}

// ─── Mock db builder that simulates Convex query chains ───────────────
function buildMockDb() {
  return {
    get(id: string) {
      for (const t of Object.keys(stores)) {
        if (stores[t]?.[id]) return stores[t][id];
      }
      return null;
    },
    insert(table: string, doc: Doc) {
      return insertRow(table, doc);
    },
    patch(id: string, updates: Doc) {
      for (const t of Object.keys(stores)) {
        if (stores[t]?.[id]) {
          Object.assign(stores[t][id], updates);
          return;
        }
      }
    },
    query(table: string) {
      const rows = Object.values(stores[table] || []);
      const filters: ((r: Doc) => boolean)[] = [];
      let sortKey: string | null = null;
      let sortAsc = true;

      const chain: any = {
        withIndex(_name: string, filterFn: (q: any) => any) {
          const eqs: [string, unknown][] = [];
          const mockQ = {
            eq(f: string, v: unknown) {
              eqs.push([f, v]);
              return mockQ;
            },
          };
          filterFn(mockQ);
          filters.push((r: Doc) => eqs.every(([f, v]) => r[f] === v));
          return chain;
        },
        eq(field: string, value: unknown) {
          filters.push((r: Doc) => r[field] === value);
          return chain;
        },
        order(dir: string) {
          sortKey = "_creationTime";
          sortAsc = dir === "asc";
          return chain;
        },
        first() {
          let filtered = rows.filter((r) => filters.every((f) => f(r)));
          if (sortKey) {
            filtered.sort((a, b) =>
              sortAsc
                ? ((a[sortKey!] as number) ?? 0) -
                  ((b[sortKey!] as number) ?? 0)
                : ((b[sortKey!] as number) ?? 0) -
                  ((a[sortKey!] as number) ?? 0)
            );
          }
          return filtered[0] ?? null;
        },
        collect() {
          let filtered = rows.filter((r) => filters.every((f) => f(r)));
          if (sortKey) {
            filtered.sort((a, b) =>
              sortAsc
                ? ((a[sortKey!] as number) ?? 0) -
                  ((b[sortKey!] as number) ?? 0)
                : ((b[sortKey!] as number) ?? 0) -
                  ((a[sortKey!] as number) ?? 0)
            );
          }
          return filtered;
        },
      };
      return chain;
    },
  };
}

// ─── Mock auth module ─────────────────────────────────────────────────
let currentAuthUserId: string | null = null;

vi.mock("@convex-dev/auth/server", () => ({
  getAuthUserId: async () => currentAuthUserId,
}));

// ─── Import handlers AFTER mocking ────────────────────────────────────
import { createReport, blockUser } from "../src/convex/reports";
import {
  endConversation,
  findListener,
  getMyActiveConversation,
} from "../src/convex/matching";
import { sendMessage, getMessages } from "../src/convex/messages";
import { submitFeedback } from "../src/convex/ratings";
import { setFirstAdmin, seedSafetyResources } from "../src/convex/seed";
import {
  approveListener,
  toggleAvailability,
  createListenerProfile,
} from "../src/convex/listeners";
import { setRole } from "../src/convex/users";

// Extract handler functions — Convex stores them as _handler
function h(fn: any) {
  return fn._handler || fn.handler;
}

const createReportH = h(createReport);
const endConversationH = h(endConversation);
const sendMessageH = h(sendMessage);
const findListenerH = h(findListener);
const getMyActiveConversationH = h(getMyActiveConversation);
const getMessagesH = h(getMessages);
const submitFeedbackH = h(submitFeedback);
const setFirstAdminH = h(setFirstAdmin);
const seedSafetyResourcesH = h(seedSafetyResources);
const blockUserH = h(blockUser);
const approveListenerH = h(approveListener);
const toggleAvailabilityH = h(toggleAvailability);
const createListenerProfileH = h(createListenerProfile);
const setRoleH = h(setRole);

function makeCtx(userId: string | null = null) {
  currentAuthUserId = userId;
  return { auth: {}, db: buildMockDb() };
}

// ─── Tests ────────────────────────────────────────────────────────────
describe("Security: createReport participant guard", () => {
  let seekerId: string;
  let listenerId: string;
  let strangerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    strangerId = insertRow("users", {
      role: "seeker",
      anonymousName: "BlueSky41",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "active",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
  });

  it("allows seeker to report within their conversation", async () => {
    const result = await createReportH(makeCtx(seekerId), {
      conversationId: convId,
      reportedUserId: listenerId,
      reason: "Harassment",
    });
    expect(result.reportId).toBeTruthy();
  });

  it("allows listener to report within their conversation", async () => {
    const result = await createReportH(makeCtx(listenerId), {
      conversationId: convId,
      reportedUserId: seekerId,
      reason: "Inappropriate content",
    });
    expect(result.reportId).toBeTruthy();
  });

  it("rejects non-participant from filing report", async () => {
    await expect(
      createReportH(makeCtx(strangerId), {
        conversationId: convId,
        reportedUserId: seekerId,
        reason: "Harassment",
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects unauthenticated user", async () => {
    await expect(
      createReportH(makeCtx(null), {
        conversationId: convId,
        reportedUserId: seekerId,
        reason: "Harassment",
      })
    ).rejects.toThrow("Not authenticated");
  });
});

describe("Security: sendMessage participant guard", () => {
  let seekerId: string;
  let listenerId: string;
  let strangerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    strangerId = insertRow("users", {
      role: "seeker",
      anonymousName: "BlueSky41",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "active",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
  });

  it("allows seeker to send message", async () => {
    const result = await sendMessageH(makeCtx(seekerId), {
      conversationId: convId,
      content: "Hello",
    });
    expect(result.messageId).toBeTruthy();
  });

  it("allows listener to send message", async () => {
    const result = await sendMessageH(makeCtx(listenerId), {
      conversationId: convId,
      content: "I'm here",
    });
    expect(result.messageId).toBeTruthy();
  });

  it("rejects non-participant from sending message", async () => {
    await expect(
      sendMessageH(makeCtx(strangerId), {
        conversationId: convId,
        content: "Sneaky",
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects message in ended conversation", async () => {
    patchRow("conversations", convId, { status: "ended" });
    await expect(
      sendMessageH(makeCtx(seekerId), {
        conversationId: convId,
        content: "Too late",
      })
    ).rejects.toThrow("not active");
  });
});

describe("Security: getMessages participant guard", () => {
  let seekerId: string;
  let listenerId: string;
  let strangerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    strangerId = insertRow("users", {
      role: "seeker",
      anonymousName: "BlueSky41",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "active",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
    insertRow("messages", {
      conversationId: convId,
      senderId: seekerId,
      senderAnonymousName: "QuietMoon27",
      content: "Hello",
      timestamp: Date.now(),
    });
  });

  it("allows seeker to read messages", async () => {
    const msgs = await getMessagesH(makeCtx(seekerId), {
      conversationId: convId,
    });
    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe("Hello");
  });

  it("allows listener to read messages", async () => {
    const msgs = await getMessagesH(makeCtx(listenerId), {
      conversationId: convId,
    });
    expect(msgs.length).toBe(1);
  });

  it("rejects non-participant from reading messages", async () => {
    await expect(
      getMessagesH(makeCtx(strangerId), { conversationId: convId })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("Security: endConversation participant guard", () => {
  let seekerId: string;
  let listenerId: string;
  let strangerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    strangerId = insertRow("users", {
      role: "seeker",
      anonymousName: "BlueSky41",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "active",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
    insertRow("listenerProfiles", {
      userId: listenerId,
      approvalStatus: "approved",
      availability: "available",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
      activeConversations: 1,
      totalConversations: 0,
    });
  });

  it("allows seeker to end conversation", async () => {
    const result = await endConversationH(makeCtx(seekerId), {
      conversationId: convId,
    });
    expect(result.success).toBe(true);
    expect(getRow("conversations", convId)?.status).toBe("ended");
    expect(getRow("conversations", convId)?.endedBy).toBe("seeker");
  });

  it("allows listener to end conversation", async () => {
    const result = await endConversationH(makeCtx(listenerId), {
      conversationId: convId,
    });
    expect(result.success).toBe(true);
    expect(getRow("conversations", convId)?.endedBy).toBe("listener");
  });

  it("rejects non-participant from ending conversation", async () => {
    await expect(
      endConversationH(makeCtx(strangerId), { conversationId: convId })
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects ending an already-ended conversation", async () => {
    patchRow("conversations", convId, { status: "ended" });
    await expect(
      endConversationH(makeCtx(seekerId), { conversationId: convId })
    ).rejects.toThrow("not active");
  });
});

describe("Matching: findListener with blocks", () => {
  let seekerId: string;
  let listenerId: string;
  let blockedListenerId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
      status: "active",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    blockedListenerId = insertRow("users", {
      role: "listener",
      anonymousName: "DarkShadow99",
    });

    insertRow("listenerProfiles", {
      userId: listenerId,
      approvalStatus: "approved",
      availability: "available",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
      activeConversations: 0,
      totalConversations: 5,
      avgRating: 4.5,
    });
    insertRow("listenerProfiles", {
      userId: blockedListenerId,
      approvalStatus: "approved",
      availability: "available",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
      activeConversations: 0,
      totalConversations: 3,
      avgRating: 4.0,
    });
  });

  it("matches with available listener when no blocks", async () => {
    const result = await findListenerH(makeCtx(seekerId), {
      categories: ["loneliness"],
      anonymousName: "QuietMoon27",
    });
    expect(result.matched).toBe(true);
    expect(result.conversationId).toBeTruthy();
  });

  it("excludes blocked listeners from matching", async () => {
    insertRow("blocks", {
      blockerId: seekerId,
      blockedId: listenerId,
      createdAt: Date.now(),
    });
    const result = await findListenerH(makeCtx(seekerId), {
      categories: ["loneliness"],
      anonymousName: "QuietMoon27",
    });
    expect(result.matched).toBe(true);
    const conv = getRow("conversations", result.conversationId as string);
    expect(conv?.listenerId).toBe(blockedListenerId);
  });

  it("puts seeker in waiting queue when no listeners available", async () => {
    for (const row of allRows("listenerProfiles")) {
      patchRow("listenerProfiles", row._id as string, {
        availability: "unavailable",
      });
    }
    const result = await findListenerH(makeCtx(seekerId), {
      categories: ["loneliness"],
      anonymousName: "QuietMoon27",
    });
    expect(result.matched).toBe(false);
    expect(result.queueId).toBeTruthy();
  });

  it("rejects suspended user from finding listener", async () => {
    patchRow("users", seekerId, { status: "suspended" });
    await expect(
      findListenerH(makeCtx(seekerId), {
        categories: ["loneliness"],
        anonymousName: "QuietMoon27",
      })
    ).rejects.toThrow("not active");
  });
});

describe("Security: getMyActiveConversation role awareness", () => {
  let seekerId: string;
  let listenerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "active",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
  });

  it("returns conversation with role=seeker for seeker", async () => {
    const result = await getMyActiveConversationH(makeCtx(seekerId), {});
    expect(result).toBeTruthy();
    expect(result.role).toBe("seeker");
    expect(result._id).toBe(convId);
  });

  it("returns conversation with role=listener for listener", async () => {
    const result = await getMyActiveConversationH(makeCtx(listenerId), {});
    expect(result).toBeTruthy();
    expect(result.role).toBe("listener");
  });

  it("returns null for unauthenticated user", async () => {
    const result = await getMyActiveConversationH(makeCtx(null), {});
    expect(result).toBeNull();
  });

  it("returns null for user not in any active conversation", async () => {
    const randomUserId = insertRow("users", {
      role: "seeker",
      anonymousName: "LostPuppy12",
    });
    const result = await getMyActiveConversationH(makeCtx(randomUserId), {});
    expect(result).toBeNull();
  });
});

describe("Security: setFirstAdmin auth guard", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("promotes first roleless user to admin", async () => {
    const userId = insertRow("users", { role: undefined, status: undefined });
    const result = await setFirstAdminH(makeCtx(userId), {});
    expect(result.success).toBe(true);
    expect(result.userId).toBe(userId);
    expect(getRow("users", userId)?.role).toBe("admin");
  });

  it("rejects unauthenticated user", async () => {
    await expect(setFirstAdminH(makeCtx(null), {})).rejects.toThrow(
      "Not authenticated"
    );
  });

  it("no-ops when admin already exists", async () => {
    insertRow("users", { role: "admin" });
    const userId = insertRow("users", { role: undefined });
    const result = await setFirstAdminH(makeCtx(userId), {});
    expect(result.adminExists).toBe(true);
  });

  it("rejects user who already has a role", async () => {
    const userId = insertRow("users", { role: "seeker" });
    const result = await setFirstAdminH(makeCtx(userId), {});
    expect(result.alreadyHasRole).toBe(true);
  });
});

describe("Ratings: submitFeedback constraints", () => {
  let seekerId: string;
  let listenerId: string;
  let convId: string;

  beforeEach(() => {
    clearAllStores();
    seekerId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    convId = insertRow("conversations", {
      seekerId,
      listenerId,
      status: "ended",
      seekerAnonymousName: "QuietMoon27",
      seekerCategories: ["loneliness"],
      createdAt: Date.now(),
    });
    insertRow("listenerProfiles", {
      userId: listenerId,
      approvalStatus: "approved",
      availability: "available",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
      avgRating: 4.0,
      totalConversations: 3,
      activeConversations: 0,
    });
  });

  it("allows seeker to submit feedback for ended conversation", async () => {
    const result = await submitFeedbackH(makeCtx(seekerId), {
      conversationId: convId,
      stars: 5,
      feltHeard: "yes",
      feelingNow: "better",
      wouldTalkAgain: true,
    });
    expect(result.ratingId).toBeTruthy();
  });

  it("rejects feedback for active conversation", async () => {
    patchRow("conversations", convId, { status: "active" });
    await expect(
      submitFeedbackH(makeCtx(seekerId), {
        conversationId: convId,
        stars: 5,
        feltHeard: "yes",
        wouldTalkAgain: true,
      })
    ).rejects.toThrow("must be ended");
  });

  it("rejects duplicate feedback from same user", async () => {
    await submitFeedbackH(makeCtx(seekerId), {
      conversationId: convId,
      stars: 5,
      feltHeard: "yes",
      wouldTalkAgain: true,
    });
    await expect(
      submitFeedbackH(makeCtx(seekerId), {
        conversationId: convId,
        stars: 3,
        feltHeard: "somewhat",
        wouldTalkAgain: false,
      })
    ).rejects.toThrow("already submitted");
  });

  it("allows both seeker and listener to submit separate feedback", async () => {
    await submitFeedbackH(makeCtx(seekerId), {
      conversationId: convId,
      stars: 5,
      feltHeard: "yes",
      feelingNow: "better",
      wouldTalkAgain: true,
    });
    const result = await submitFeedbackH(makeCtx(listenerId), {
      conversationId: convId,
      stars: 4,
      feltHeard: "somewhat",
      wouldTalkAgain: true,
    });
    expect(result.ratingId).toBeTruthy();
    expect(allRows("ratings").length).toBe(2);
  });
});

describe("Security: admin authorization checks", () => {
  let adminId: string;
  let nonAdminId: string;

  beforeEach(() => {
    clearAllStores();
    adminId = insertRow("users", { role: "admin", name: "Admin User" });
    nonAdminId = insertRow("users", {
      role: "seeker",
      anonymousName: "QuietMoon27",
    });
  });

  it("admin can approve listener", async () => {
    const listenerUserId = insertRow("users", {
      role: undefined,
      anonymousName: "HelpfulSoul88",
    });
    const profileId = insertRow("listenerProfiles", {
      userId: listenerUserId,
      approvalStatus: "pending",
      availability: "unavailable",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
    });
    const result = await approveListenerH(makeCtx(adminId), { profileId });
    expect(result.success).toBe(true);
    expect(getRow("listenerProfiles", profileId)?.approvalStatus).toBe(
      "approved"
    );
  });

  it("non-admin cannot approve listener", async () => {
    const listenerUserId = insertRow("users", { role: undefined });
    const profileId = insertRow("listenerProfiles", {
      userId: listenerUserId,
      approvalStatus: "pending",
      availability: "unavailable",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
    });
    await expect(
      approveListenerH(makeCtx(nonAdminId), { profileId })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("Listener: toggleAvailability restrictions", () => {
  let listenerId: string;
  let profileId: string;

  beforeEach(() => {
    clearAllStores();
    listenerId = insertRow("users", {
      role: "listener",
      anonymousName: "GentleCloud82",
    });
    profileId = insertRow("listenerProfiles", {
      userId: listenerId,
      approvalStatus: "approved",
      availability: "unavailable",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: true,
    });
  });

  it("approved listener can toggle availability on", async () => {
    const result = await toggleAvailabilityH(makeCtx(listenerId), {
      available: true,
    });
    expect(result.success).toBe(true);
    expect(getRow("listenerProfiles", profileId)?.availability).toBe(
      "available"
    );
  });

  it("pending listener cannot toggle availability", async () => {
    patchRow("listenerProfiles", profileId, { approvalStatus: "pending" });
    await expect(
      toggleAvailabilityH(makeCtx(listenerId), { available: true })
    ).rejects.toThrow("pending approval");
  });

  it("user without listener profile cannot toggle", async () => {
    const userId = insertRow("users", {
      role: "seeker",
      anonymousName: "LostPuppy12",
    });
    await expect(
      toggleAvailabilityH(makeCtx(userId), { available: true })
    ).rejects.toThrow("No listener profile");
  });
});

describe("Listener: createListenerProfile dedup", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("creates profile for new listener", async () => {
    const userId = insertRow("users", { role: undefined });
    const result = await createListenerProfileH(makeCtx(userId), {
      whyListen: "I enjoy helping",
      languages: ["English"],
      topics: ["loneliness"],
    });
    expect(result.profileId).toBeTruthy();
  });

  it("rejects duplicate listener profile", async () => {
    const userId = insertRow("users", { role: undefined });
    insertRow("listenerProfiles", {
      userId,
      approvalStatus: "pending",
      availability: "unavailable",
      languages: ["English"],
      topics: ["loneliness"],
      trainingCompleted: false,
    });
    await expect(
      createListenerProfileH(makeCtx(userId), {
        whyListen: "I enjoy helping",
        languages: ["English"],
        topics: ["loneliness"],
      })
    ).rejects.toThrow("already exists");
  });
});

describe("Users: setRole dedup", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("sets role for first-time user with anonymous name", async () => {
    const userId = insertRow("users", { role: undefined });
    const result = await setRoleH(makeCtx(userId), { role: "seeker" });
    expect(result.success).toBe(true);
    const user = getRow("users", userId);
    expect(user?.role).toBe("seeker");
    expect(typeof user?.anonymousName).toBe("string");
    expect((user?.anonymousName as string).length).toBeGreaterThan(0);
    expect(user?.status).toBe("active");
  });

  it("rejects setting role when already set", async () => {
    const userId = insertRow("users", { role: "listener" });
    await expect(
      setRoleH(makeCtx(userId), { role: "seeker" })
    ).rejects.toThrow("already set");
  });
});

describe("Safety: seedSafetyResources idempotency", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("seeds resources on first call", async () => {
    const adminId = insertRow("users", { role: "admin" });
    const result = await seedSafetyResourcesH(makeCtx(adminId), {});
    expect(result.seeded).toBe(5);
  });

  it("no-ops on second call", async () => {
    const adminId = insertRow("users", { role: "admin" });
    await seedSafetyResourcesH(makeCtx(adminId), {});
    const result = await seedSafetyResourcesH(makeCtx(adminId), {});
    expect(result.alreadySeeded).toBe(true);
    expect(countRows("safetyResources")).toBe(5);
  });
});

describe("Block: blockUser idempotency", () => {
  beforeEach(() => {
    clearAllStores();
  });

  it("blocks a user", async () => {
    const userId = insertRow("users", { role: "seeker" });
    const otherId = insertRow("users", { role: "listener" });
    const result = await blockUserH(makeCtx(userId), {
      blockedUserId: otherId,
    });
    expect(result.success).toBe(true);
  });

  it("no-ops when already blocked", async () => {
    const userId = insertRow("users", { role: "seeker" });
    const otherId = insertRow("users", { role: "listener" });
    insertRow("blocks", {
      blockerId: userId,
      blockedId: otherId,
      createdAt: Date.now(),
    });
    const result = await blockUserH(makeCtx(userId), {
      blockedUserId: otherId,
    });
    expect(result.alreadyBlocked).toBe(true);
  });
});
