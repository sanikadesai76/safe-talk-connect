import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSafetyResources = query({
  args: { country: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.country) {
      return await ctx.db
        .query("safetyResources")
        .withIndex("by_country", (q) => q.eq("country", args.country!))
        .collect();
    }
    return await ctx.db.query("safetyResources").collect();
  },
});

export const addSafetyResource = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    country: v.string(),
    phone: v.optional(v.string()),
    url: v.optional(v.string()),
    category: v.string(),
    isEmergency: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const id = await ctx.db.insert("safetyResources", args);
    return { id };
  },
});

export const deleteSafetyResource = mutation({
  args: { resourceId: v.id("safetyResources") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.delete(args.resourceId);
    return { success: true };
  },
});

export const updateSafetyResource = mutation({
  args: {
    resourceId: v.id("safetyResources"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    url: v.optional(v.string()),
    category: v.optional(v.string()),
    isEmergency: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.url !== undefined) updates.url = args.url;
    if (args.category !== undefined) updates.category = args.category;
    if (args.isEmergency !== undefined) updates.isEmergency = args.isEmergency;

    await ctx.db.patch(args.resourceId, updates);
    return { success: true };
  },
});
