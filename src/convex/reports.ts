import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createReport = mutation({
  args: {
    conversationId: v.id("conversations"),
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const reportedUser = await ctx.db.get(args.reportedUserId);
    if (!reportedUser) throw new Error("Reported user not found");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const reportId = await ctx.db.insert("reports", {
      conversationId: args.conversationId,
      reporterId: userId,
      reporterAnonymousName: user?.anonymousName || "Anonymous",
      reportedUserId: args.reportedUserId,
      reportedUserAnonymousName: reportedUser.anonymousName || "Anonymous",
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { reportId };
  },
});

export const blockUser = mutation({
  args: {
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already blocked
    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.blockedUserId)
      )
      .first();
    if (existing) return { success: true, alreadyBlocked: true };

    await ctx.db.insert("blocks", {
      blockerId: userId,
      blockedId: args.blockedUserId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const getReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const reports = await ctx.db
      .query("reports")
      .order("desc")
      .collect();

    return reports;
  },
});

export const getMyReports = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .order("desc")
      .collect();

    return reports;
  },
});

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.reportId, {
      status: args.status,
      adminNotes: args.adminNotes,
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    return { success: true };
  },
});
