import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createListenerProfile = mutation({
  args: {
    whyListen: v.string(),
    languages: v.array(v.string()),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) throw new Error("Listener profile already exists");

    const profileId = await ctx.db.insert("listenerProfiles", {
      userId,
      approvalStatus: "pending",
      availability: "unavailable",
      languages: args.languages,
      topics: args.topics,
      whyListen: args.whyListen,
      trainingCompleted: false,
      totalConversations: 0,
      activeConversations: 0,
    });

    return { profileId };
  },
});

export const completeTraining = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No listener profile found");

    await ctx.db.patch(profile._id, { trainingCompleted: true });
    return { success: true };
  },
});

export const toggleAvailability = mutation({
  args: { available: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No listener profile found");
    if (profile.approvalStatus !== "approved")
      throw new Error(
        profile.approvalStatus === "pending"
          ? "Your application is still pending approval. Please wait for an admin to approve your account before going online."
          : profile.approvalStatus === "rejected"
            ? "Your listener application was not approved. Please contact support."
            : profile.approvalStatus === "suspended"
              ? "Your listener account has been suspended. Please contact an administrator."
              : "You must be an approved listener to go online."
      );

    await ctx.db.patch(profile._id, {
      availability: args.available ? "available" : "unavailable",
    });
    return { success: true };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return profile;
  },
});

export const getAvailableListeners = query({
  args: {},
  handler: async (ctx) => {
    const listeners = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_approval_availability", (q) =>
        q.eq("approvalStatus", "approved").eq("availability", "available")
      )
      .collect();

    return Promise.all(
      listeners.map(async (l) => {
        const user = await ctx.db.get(l.userId);
        return {
          _id: l._id,
          userId: l.userId,
          anonymousName: user?.anonymousName || "Anonymous",
          languages: l.languages,
          topics: l.topics,
          avgRating: l.avgRating,
          totalConversations: l.totalConversations,
          activeConversations: l.activeConversations,
        };
      })
    );
  },
});

export const getPendingListeners = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const listeners = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_approval", (q) => q.eq("approvalStatus", "pending"))
      .collect();

    return Promise.all(
      listeners.map(async (l) => {
        const user = await ctx.db.get(l.userId);
        return {
          _id: l._id,
          userId: l.userId,
          name: user?.name,
          email: user?.email,
          anonymousName: user?.anonymousName,
          languages: l.languages,
          topics: l.topics,
          whyListen: l.whyListen,
          trainingCompleted: l.trainingCompleted,
          approvalStatus: l.approvalStatus,
          createdAt: l._creationTime,
        };
      })
    );
  },
});

export const getAllListeners = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const listeners = await ctx.db.query("listenerProfiles").collect();

    return Promise.all(
      listeners.map(async (l) => {
        const user = await ctx.db.get(l.userId);
        return {
          _id: l._id,
          userId: l.userId,
          name: user?.name,
          email: user?.email,
          anonymousName: user?.anonymousName,
          languages: l.languages,
          topics: l.topics,
          approvalStatus: l.approvalStatus,
          availability: l.availability,
          trainingCompleted: l.trainingCompleted,
          avgRating: l.avgRating,
          totalConversations: l.totalConversations,
          activeConversations: l.activeConversations,
          createdAt: l._creationTime,
        };
      })
    );
  },
});

export const approveListener = mutation({
  args: { profileId: v.id("listenerProfiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(args.profileId, { approvalStatus: "approved" });
    await ctx.db.patch(profile.userId, { role: "listener" });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "listener",
      targetId: profile.userId,
      action: "approve",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const rejectListener = mutation({
  args: { profileId: v.id("listenerProfiles"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(args.profileId, { approvalStatus: "rejected" });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "listener",
      targetId: profile.userId,
      action: "reject",
      reason: args.reason,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const suspendListener = mutation({
  args: { profileId: v.id("listenerProfiles"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(args.profileId, {
      approvalStatus: "suspended",
      availability: "unavailable",
    });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "listener",
      targetId: profile.userId,
      action: "suspend",
      reason: args.reason,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
