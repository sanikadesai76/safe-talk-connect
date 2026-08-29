import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const allUsers = await ctx.db.query("users").collect();
    const allConversations = await ctx.db.query("conversations").collect();
    const allReports = await ctx.db.query("reports").collect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const totalUsers = allUsers.length;
    const seekers = allUsers.filter((u) => u.role === "seeker").length;
    const listeners = allUsers.filter((u) => u.role === "listener").length;

    const listenerProfiles = await ctx.db.query("listenerProfiles").collect();
    const approvedListeners = listenerProfiles.filter(
      (p) => p.approvalStatus === "approved"
    ).length;

    const activeConversations = allConversations.filter(
      (c) => c.status === "active"
    ).length;
    const conversationsToday = allConversations.filter(
      (c) => c.createdAt >= todayTimestamp
    ).length;

    const pendingReports = allReports.filter((r) => r.status === "pending").length;
    const suspendedAccounts = allUsers.filter(
      (u) => u.status === "suspended"
    ).length;

    const allRatings = await ctx.db.query("ratings").collect();
    const avgRating =
      allRatings.length > 0
        ? Math.round(
            (allRatings.reduce((sum, r) => sum + r.stars, 0) /
              allRatings.length) *
              10
          ) / 10
        : 0;

    return {
      totalUsers,
      seekers,
      listeners,
      approvedListeners,
      activeConversations,
      conversationsToday,
      pendingReports,
      suspendedAccounts,
      avgRating,
      totalRatings: allRatings.length,
    };
  },
});

export const getRecentReports = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const reports = await ctx.db.query("reports").order("desc").collect();
    return reports.slice(0, args.limit || 20);
  },
});

export const updateSiteSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: userId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: args.key,
        value: args.value,
        updatedBy: userId,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const getSiteSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return setting?.value || null;
  },
});
