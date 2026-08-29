import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const ADJECTIVES = [
  "Quiet", "Gentle", "Calm", "Soft", "Warm",
  "Bright", "Clear", "Kind", "Peaceful", "Serene",
  "Hopeful", "Steady", "Brave", "Sweet", "Tender",
  "Luminous", "Harmonious", "Graceful", "Patient", "Radiant",
];

const NOUNS = [
  "Moon", "Sky", "Cloud", "River", "Breeze",
  "Star", "Wave", "Leaf", "Light", "Stone",
  "Harbor", "Shore", "Meadow", "Dawn", "Echo",
  "Bird", "Petal", "Rain", "Grove", "Haven",
];

function generateAnonymousName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
}

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    return user;
  },
});

export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
};

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    anonymousName: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    role: v.optional(v.union(v.literal("seeker"), v.literal("listener"), v.literal("admin"))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.anonymousName !== undefined) updates.anonymousName = args.anonymousName;
    if (args.languages !== undefined) updates.languages = args.languages;
    if (args.role !== undefined) updates.role = args.role;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

export const setRole = mutation({
  args: { role: v.union(v.literal("seeker"), v.literal("listener"), v.literal("admin")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db.get(userId);
    if (existingUser?.role) throw new Error("Role already set");

    await ctx.db.patch(userId, {
      role: args.role,
      anonymousName: generateAnonymousName(),
      status: "active",
    });

    return { success: true };
  },
});

export const regenerateAnonymousName = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const name = generateAnonymousName();
    await ctx.db.patch(userId, { anonymousName: name });
    return { anonymousName: name };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new Error("Unauthorized");

    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      anonymousName: u.anonymousName,
      displayName: u.displayName,
      createdAt: u._creationTime,
    }));
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      role: user.role,
      status: user.status,
      anonymousName: user.anonymousName,
      displayName: user.displayName,
      languages: user.languages,
      createdAt: user._creationTime,
    };
  },
});

export const suspendUser = mutation({
  args: { targetUserId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.targetUserId, { status: "suspended" });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "user",
      targetId: args.targetUserId,
      action: "suspend",
      reason: args.reason,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const reactivateUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.targetUserId, { status: "active" });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "user",
      targetId: args.targetUserId,
      action: "reactivate",
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const banUser = mutation({
  args: { targetUserId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.targetUserId, { status: "banned" });
    await ctx.db.insert("adminActions", {
      adminId: userId,
      targetType: "user",
      targetId: args.targetUserId,
      action: "ban",
      reason: args.reason,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});
