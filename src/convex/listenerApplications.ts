import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAIL = "sddesai1603@gmail.com";

// --- Scenario questions ---
// These are the scenario-based screening questions.
// The core safety/boundary scenarios (4, 5, 9) are always included.
// Others are drawn from a pool.

const SCENARIO_POOL = [
  {
    id: "listening_vs_solving",
    title: "Listening vs. Solving",
    scenario:
      "A person tells you: \"I failed an important exam. My parents are disappointed in me and I feel like I've let everyone down.\"",
    question: "What would you say in your first response?",
    followUp: "Why would you respond that way?",
  },
  {
    id: "advice_rejected",
    title: "Advice Rejected",
    scenario:
      "You listen to someone explain a problem. You offer a suggestion, but they say: \"I've already tried that. You don't understand.\"",
    question: "What would you do next?",
    followUp: "What would you avoid saying?",
  },
  {
    id: "repeated_conversation",
    title: "Repeated Conversation",
    scenario:
      "A person comes back several times and talks about the same problem. You feel like they aren't making any changes.",
    question: "What would you do?",
    followUp: "",
  },
  {
    id: "emotional_dependency",
    title: "Emotional Dependency",
    scenario:
      "A seeker tells you: \"You're the only person who understands me. I don't want to talk to anyone else. Can I have your personal Instagram so we can keep talking outside SafeTalk?\"",
    question: "What would you do?",
    followUp: "",
  },
  {
    id: "anger",
    title: "Anger",
    scenario:
      "A seeker becomes frustrated and says: \"You're useless. You're not helping me at all.\"",
    question: "How would you respond?",
    followUp: "",
  },
  {
    id: "different_values",
    title: "Different Values",
    scenario:
      "A seeker describes a personal decision that you strongly disagree with. You believe their decision is wrong.",
    question: "How would you handle the conversation?",
    followUp: "",
  },
  {
    id: "personal_trigger",
    title: "Personal Trigger",
    scenario:
      "A seeker talks about an experience that reminds you strongly of something difficult in your own life.",
    question: "What would you do?",
    followUp: "",
  },
  {
    id: "silence",
    title: "Silence",
    scenario:
      "The person you're talking to gives a short answer and then becomes quiet.",
    question: "What would you do?",
    followUp: "",
  },
  {
    id: "crisis_safety",
    title: "Crisis / Safety",
    scenario:
      "A seeker says something that makes you seriously concerned about their immediate safety.",
    question: "What would you do?",
    followUp: "",
  },
  {
    id: "self_awareness",
    title: "Self-Awareness",
    scenario: "",
    question:
      "What is one situation where you think you would NOT be a good listener?",
    followUp: "",
  },
];

// Core scenarios that are always included
const CORE_SCENARIO_IDS = ["emotional_dependency", "anger", "crisis_safety"];

/**
 * Get the scenario questions for an application.
 * Core scenarios are always included. Others are randomly selected to fill 10 total.
 */
function getScenariosForApplication(): typeof SCENARIO_POOL {
  const core = SCENARIO_POOL.filter((s) => CORE_SCENARIO_IDS.includes(s.id));
  const pool = SCENARIO_POOL.filter((s) => !CORE_SCENARIO_IDS.includes(s.id));
  const needed = 10 - core.length;

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return [...core, ...pool.slice(0, needed)];
}

// --- Queries ---

/** Get the current user's listener application (if any). */
export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const app = await ctx.db
      .query("listenerApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    return app;
  },
});

/** Get scenario questions for the application form. */
export const getScenarioQuestions = query({
  args: {},
  handler: async () => {
    return getScenariosForApplication();
  },
});

/** Admin: Get all listener applications. */
export const getAllApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(userId);
    if (caller?.role !== "admin" || caller?.email !== ADMIN_EMAIL) {
      throw new Error("Unauthorized");
    }

    const apps = await ctx.db.query("listenerApplications").collect();

    return Promise.all(
      apps.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        const profile = await ctx.db
          .query("listenerProfiles")
          .withIndex("by_user", (q) => q.eq("userId", app.userId))
          .first();
        return {
          _id: app._id,
          userId: app.userId,
          anonymousName: user?.anonymousName || "Unknown",
          email: user?.email,
          status: app.status,
          languages: app.languages,
          availability: app.availability,
          whyListen: app.whyListen,
          previousExperience: app.previousExperience,
          createdAt: app._creationTime,
          reviewedAt: app.reviewedAt,
          trainingCompleted: profile?.trainingCompleted || false,
          approvalStatus: profile?.approvalStatus,
          flags: app.flags,
        };
      }),
    );
  },
});

/** Admin: Get full application details for review. */
export const getApplicationDetail = query({
  args: { applicationId: v.id("listenerApplications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(userId);
    if (caller?.role !== "admin" || caller?.email !== ADMIN_EMAIL) {
      throw new Error("Unauthorized");
    }

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");

    const user = await ctx.db.get(app.userId);
    return {
      ...app,
      userName: user?.name,
      userEmail: user?.email,
      userAnonymousName: user?.anonymousName,
    };
  },
});

// --- Mutations ---

/** Submit or update a listener application. */
export const submitApplication = mutation({
  args: {
    anonymousName: v.optional(v.string()),
    ageRange: v.optional(v.string()),
    languages: v.array(v.string()),
    timezone: v.optional(v.string()),
    availability: v.optional(v.string()),
    whyListen: v.optional(v.string()),
    previousExperience: v.optional(v.boolean()),
    experienceDescription: v.optional(v.string()),
    comfortableTopics: v.array(v.string()),
    uncomfortableTopics: v.optional(v.string()),
    answers: v.record(v.string(), v.string()),
    originalityConfirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate originality
    if (!args.originalityConfirmed) {
      throw new Error("You must confirm that your answers are your own work.");
    }

    // Validate answers exist and have minimum length
    const requiredScenarios = [
      "listening_vs_solving",
      "advice_rejected",
      "repeated_conversation",
      "emotional_dependency",
      "anger",
      "different_values",
      "personal_trigger",
      "silence",
      "crisis_safety",
      "self_awareness",
    ];

    for (const id of requiredScenarios) {
      const answer = args.answers[id];
      if (!answer || answer.trim().length < 100) {
        throw new Error(
          `Please provide a meaningful answer (at least 100 characters) for scenario: ${id.replace(/_/g, " ")}`,
        );
      }
    }

    // Check for flags
    const flags: string[] = [];
    const allAnswers = Object.values(args.answers).join(" ").toLowerCase();

    // Red flag checks
    if (
      allAnswers.includes("romantic") ||
      allAnswers.includes("date") ||
      allAnswers.includes("boyfriend") ||
      allAnswers.includes("girlfriend")
    ) {
      flags.push("mentions romantic interest");
    }
    if (
      allAnswers.includes("diagnos") ||
      allAnswers.includes("prescri") ||
      allAnswers.includes("therapist")
    ) {
      flags.push("mentions diagnosis or therapy");
    }
    if (
      allAnswers.includes("instagram") ||
      allAnswers.includes("phone number") ||
      allAnswers.includes("personal contact")
    ) {
      flags.push("mentions sharing personal contact info");
    }
    if (
      allAnswers.includes("keep secret") ||
      allAnswers.includes("hide") ||
      allAnswers.includes("not tell anyone")
    ) {
      flags.push("mentions keeping safety concerns secret");
    }

    // Check for very short average answers
    const avgLength =
      Object.values(args.answers).reduce((sum, a) => sum + a.length, 0) /
      Object.values(args.answers).length;
    if (avgLength < 150) {
      flags.push("answers are unusually short on average");
    }

    // Check for duplicate answers
    const answerValues = Object.values(args.answers);
    const uniqueAnswers = new Set(answerValues);
    if (uniqueAnswers.size < answerValues.length * 0.7) {
      flags.push("multiple answers appear very similar");
    }

    // Check for concerning content in crisis scenario
    const crisisAnswer = args.answers["crisis_safety"] || "";
    if (
      crisisAnswer.toLowerCase().includes("keep it between") ||
      crisisAnswer.toLowerCase().includes("not tell") ||
      crisisAnswer.toLowerCase().includes("keep it secret")
    ) {
      flags.push("may not escalate safety concerns appropriately");
    }

    // Check for desire to move off-platform
    const dependencyAnswer = args.answers["emotional_dependency"] || "";
    if (
      dependencyAnswer.toLowerCase().includes("sure, here") ||
      dependencyAnswer.toLowerCase().includes("give them") ||
      dependencyAnswer.toLowerCase().includes("why not")
    ) {
      flags.push("may not maintain platform boundaries");
    }

    // Check for existing application
    const existing = await ctx.db
      .query("listenerApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing draft or rejected application
      if (existing.status === "draft" || existing.status === "rejected") {
        await ctx.db.patch(existing._id, {
          ...args,
          status: "submitted",
          flags,
          reviewedAt: undefined,
          reviewerId: undefined,
          adminNotes: undefined,
          decisionReason: undefined,
          scores: undefined,
        });
        return { applicationId: existing._id, updated: true };
      }
      // If already submitted/under_review, don't allow resubmission
      throw new Error(
        "You already have an application under review. Please wait for a decision.",
      );
    }

    // Create new application
    const applicationId = await ctx.db.insert("listenerApplications", {
      userId,
      status: "submitted",
      ...args,
      flags,
    });

    return { applicationId, created: true };
  },
});

/** Admin: Update application status. */
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("listenerApplications"),
    status: v.string(),
    decisionReason: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    scores: v.optional(
      v.object({
        empathy: v.optional(v.number()),
        listeningOrientation: v.optional(v.number()),
        emotionalRegulation: v.optional(v.number()),
        selfAwareness: v.optional(v.number()),
        boundaries: v.optional(v.number()),
        judgment: v.optional(v.number()),
        safetyAwareness: v.optional(v.number()),
        overallSuitability: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(userId);
    if (caller?.role !== "admin" || caller?.email !== ADMIN_EMAIL) {
      throw new Error("Unauthorized");
    }

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new Error("Application not found");

    const patch: Record<string, unknown> = {
      status: args.status,
      reviewerId: userId,
      reviewedAt: Date.now(),
    };
    if (args.decisionReason !== undefined) patch.decisionReason = args.decisionReason;
    if (args.adminNotes !== undefined) patch.adminNotes = args.adminNotes;
    if (args.scores !== undefined) patch.scores = args.scores;

    await ctx.db.patch(args.applicationId, patch);

    // If approved, create or update the listener profile
    if (args.status === "approved") {
      const existingProfile = await ctx.db
        .query("listenerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", app.userId))
        .first();

      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, {
          approvalStatus: "pending", // pending training
        });
      } else {
        await ctx.db.insert("listenerProfiles", {
          userId: app.userId,
          approvalStatus: "pending",
          availability: "unavailable",
          languages: app.languages,
          topics: app.comfortableTopics,
          whyListen: app.whyListen,
          trainingCompleted: false,
          totalConversations: 0,
          activeConversations: 0,
        });
      }
    }

    // If rejected, update existing profile if any
    if (args.status === "rejected") {
      const existingProfile = await ctx.db
        .query("listenerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", app.userId))
        .first();
      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, { approvalStatus: "rejected" });
      }
    }

    // Log admin action
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "listener",
      targetId: app.userId,
      action: `application_${args.status}`,
      reason: args.decisionReason,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Admin: Update just the notes/scores without changing status. */
export const updateApplicationNotes = mutation({
  args: {
    applicationId: v.id("listenerApplications"),
    adminNotes: v.optional(v.string()),
    scores: v.optional(
      v.object({
        empathy: v.optional(v.number()),
        listeningOrientation: v.optional(v.number()),
        emotionalRegulation: v.optional(v.number()),
        selfAwareness: v.optional(v.number()),
        boundaries: v.optional(v.number()),
        judgment: v.optional(v.number()),
        safetyAwareness: v.optional(v.number()),
        overallSuitability: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(userId);
    if (caller?.role !== "admin" || caller?.email !== ADMIN_EMAIL) {
      throw new Error("Unauthorized");
    }

    const patch: Record<string, unknown> = {};
    if (args.adminNotes !== undefined) patch.adminNotes = args.adminNotes;
    if (args.scores !== undefined) patch.scores = args.scores;

    await ctx.db.patch(args.applicationId, patch);
    return { success: true };
  },
});
