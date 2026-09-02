import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  SEEKER: "seeker",
  LISTENER: "listener",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.SEEKER),
  v.literal(ROLES.LISTENER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      anonymousName: v.optional(v.string()),
      displayName: v.optional(v.string()),
      languages: v.optional(v.array(v.string())),
      status: v.optional(v.string()), // active, suspended, banned
    })
      .index("email", ["email"])
      .index("by_role", ["role"])
      .index("by_status", ["status"]),

    listenerProfiles: defineTable({
      userId: v.id("users"),
      approvalStatus: v.string(), // pending, approved, rejected, suspended
      availability: v.string(), // available, unavailable
      languages: v.array(v.string()),
      topics: v.array(v.string()),
      whyListen: v.optional(v.string()),
      trainingCompleted: v.boolean(),
      avgRating: v.optional(v.number()),
      totalConversations: v.optional(v.number()),
      activeConversations: v.optional(v.number()),
      bio: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_approval", ["approvalStatus"])
      .index("by_availability", ["availability"])
      .index("by_approval_availability", ["approvalStatus", "availability"]),

    conversations: defineTable({
      seekerId: v.id("users"),
      listenerId: v.id("users"),
      seekerAnonymousName: v.string(),
      listenerAnonymousName: v.optional(v.string()),
      status: v.string(), // waiting, matched, active, ended, reported, under_review
      seekerCategories: v.array(v.string()),
      createdAt: v.number(),
      endedAt: v.optional(v.number()),
      endedBy: v.optional(v.string()), // seeker, listener, admin
    })
      .index("by_seeker", ["seekerId"])
      .index("by_listener", ["listenerId"])
      .index("by_status", ["status"])
      .index("by_seeker_status", ["seekerId", "status"])
      .index("by_listener_status", ["listenerId", "status"]),

    messages: defineTable({
      conversationId: v.id("conversations"),
      senderId: v.id("users"),
      senderAnonymousName: v.string(),
      content: v.string(),
      timestamp: v.number(),
      isSystem: v.optional(v.boolean()),
    })
      .index("by_conversation", ["conversationId"])
      .index("by_conversation_timestamp", ["conversationId", "timestamp"]),

    reports: defineTable({
      conversationId: v.id("conversations"),
      reporterId: v.id("users"),
      reporterAnonymousName: v.string(),
      reportedUserId: v.id("users"),
      reportedUserAnonymousName: v.string(),
      reason: v.string(),
      details: v.optional(v.string()),
      status: v.string(), // pending, reviewed, warned, suspended, banned, resolved
      adminNotes: v.optional(v.string()),
      createdAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewedBy: v.optional(v.id("users")),
    })
      .index("by_reporter", ["reporterId"])
      .index("by_reported_user", ["reportedUserId"])
      .index("by_status", ["status"])
      .index("by_conversation", ["conversationId"]),

    blocks: defineTable({
      blockerId: v.id("users"),
      blockedId: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_blocker", ["blockerId"])
      .index("by_blocked", ["blockedId"])
      .index("by_pair", ["blockerId", "blockedId"]),

    ratings: defineTable({
      conversationId: v.id("conversations"),
      userId: v.id("users"),
      stars: v.number(),
      feltHeard: v.string(), // yes, somewhat, no
      feelingNow: v.optional(v.string()), // better, same, worse (seeker only)
      wouldTalkAgain: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_conversation", ["conversationId"])
      .index("by_user", ["userId"])
      .index("by_conversation_user", ["conversationId", "userId"]),

    waitingQueue: defineTable({
      seekerId: v.id("users"),
      anonymousName: v.string(),
      categories: v.array(v.string()),
      status: v.string(), // waiting, matched, cancelled
      createdAt: v.number(),
      matchedAt: v.optional(v.number()),
      conversationId: v.optional(v.id("conversations")),
    })
      .index("by_status", ["status"])
      .index("by_seeker", ["seekerId"]),

    safetyResources: defineTable({
      title: v.string(),
      description: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
      url: v.optional(v.string()),
      category: v.string(), // crisis, therapy, hotline, other
      isEmergency: v.boolean(),
    })
      .index("by_country", ["country"])
      .index("by_category", ["category"]),

    adminActions: defineTable({
      adminId: v.id("users"),
      targetType: v.string(), // user, listener, conversation, report
      targetId: v.id("users"),
      action: v.string(), // approve, reject, suspend, ban, warn, reactivate
      reason: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_admin", ["adminId"])
      .index("by_target", ["targetId"]),

    listenerApplications: defineTable({
      userId: v.id("users"),
      status: v.string(), // draft, submitted, under_review, needs_more_info, approved, rejected
      // Basic info
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
      // Scenario answers (keyed by scenario ID)
      answers: v.record(v.string(), v.string()),
      // Originality
      originalityConfirmed: v.boolean(),
      // Admin review
      adminNotes: v.optional(v.string()),
      reviewerId: v.optional(v.id("users")),
      reviewedAt: v.optional(v.number()),
      decisionReason: v.optional(v.string()),
      // Rubric scores (1-5, optional)
      scores: v.optional(v.object({
        empathy: v.optional(v.number()),
        listeningOrientation: v.optional(v.number()),
        emotionalRegulation: v.optional(v.number()),
        selfAwareness: v.optional(v.number()),
        boundaries: v.optional(v.number()),
        judgment: v.optional(v.number()),
        safetyAwareness: v.optional(v.number()),
        overallSuitability: v.optional(v.number()),
      })),
      // Flags detected during submission
      flags: v.optional(v.array(v.string())),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"]),

    siteSettings: defineTable({
      key: v.string(),
      value: v.string(),
      updatedBy: v.optional(v.id("users")),
      updatedAt: v.optional(v.number()),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
