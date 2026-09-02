import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSafetyResources = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("safetyResources").first();
    if (existing) return { alreadySeeded: true };

    const resources = [
      {
        title: "National Suicide Prevention Lifeline",
        description: "24/7 free and confidential support for people in distress.",
        country: "US",
        phone: "988",
        url: "https://988lifeline.org/",
        category: "crisis",
        isEmergency: true,
      },
      {
        title: "Crisis Text Line",
        description: "Free 24/7 text-based support for people in crisis.",
        country: "US",
        phone: "Text HOME to 741741",
        url: "https://www.crisistextline.org/",
        category: "crisis",
        isEmergency: true,
      },
      {
        title: "National Domestic Violence Hotline",
        description: "Confidential support for anyone affected by domestic violence.",
        country: "US",
        phone: "1-800-799-7233",
        url: "https://www.thehotline.org/",
        category: "hotline",
        isEmergency: true,
      },
      {
        title: "SAMHSA National Helpline",
        description: "Free treatment referral and information service for mental health and substance use disorders.",
        country: "US",
        phone: "1-800-662-4357",
        url: "https://www.samhsa.gov/find-help/national-helpline",
        category: "therapy",
        isEmergency: false,
      },
      {
        title: "International Association for Suicide Prevention",
        description: "Directory of crisis centers worldwide.",
        country: "International",
        phone: undefined,
        url: "https://www.iasp.info/resources/Crisis_Centres/",
        category: "crisis",
        isEmergency: false,
      },
    ];

    for (const resource of resources) {
      await ctx.db.insert("safetyResources", resource);
    }

    return { seeded: resources.length };
  },
});

export const promoteToAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(callerId);
    if (caller?.email !== ADMIN_EMAIL || caller?.role !== "admin") {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.userId, { role: "admin" });
    return { success: true };
  },
});

const ADMIN_EMAIL = "sddesai1603@gmail.com";

/**
 * Wipe all user-generated data. Only callable by the admin email.
 * This resets the platform to a clean state so users can sign up fresh.
 */
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caller = await ctx.db.get(userId);
    if (!caller) throw new Error("User not found");
    if (caller.email !== ADMIN_EMAIL || caller.role !== "admin") {
      throw new Error("Not authorized");
    }

    const tables = [
      "users",
      "listenerProfiles",
      "listenerApplications",
      "conversations",
      "messages",
      "reports",
      "blocks",
      "ratings",
      "waitingQueue",
      "safetyResources",
      "adminActions",
      "siteSettings",
    ] as const;

    let totalDeleted = 0;
    for (const table of tables) {
      const allDocs = await ctx.db.query(table).collect();
      for (const doc of allDocs) {
        // Preserve the admin's own user record so they stay logged in
        if (table === "users" && doc._id === userId) continue;
        await ctx.db.delete(doc._id);
        totalDeleted++;
      }
    }

    // Reset admin account to clean state (keep the user, reset derived fields)
    await ctx.db.patch(userId, {
      role: "admin",
      status: "active",
      anonymousName: undefined,
      displayName: undefined,
      languages: undefined,
    });

    // Wipe auth accounts/sessions (except admin's) so deleted users are logged out
    const authTables = ["authAccounts", "authSessions", "authRefreshTokens"] as const;
    for (const table of authTables) {
      try {
        const allDocs = await ctx.db.query(table).collect();
        for (const doc of allDocs) {
          // Preserve the admin's own auth session
          if ((doc as Record<string, unknown>).userId === userId) continue;
          await ctx.db.delete(doc._id);
          totalDeleted++;
        }
      } catch {
        // Table might not exist — skip
      }
    }

    return { success: true, deleted: totalDeleted };
  },
});

export const setFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caller = await ctx.db.get(userId);
    if (!caller) throw new Error("User not found");

    // Only the specific admin email can become admin
    if (caller.email !== ADMIN_EMAIL) {
      throw new Error("Not authorized to become admin");
    }

    // Already an admin? Nothing to do
    if (caller.role === "admin") return { alreadyAdmin: true };

    // Demote any existing admin to seeker (only one admin allowed)
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();
    if (existingAdmin && existingAdmin._id !== userId) {
      await ctx.db.patch(existingAdmin._id, { role: "seeker" });
    }

    // Promote this user to admin (works even if they already have seeker/listener role)
    await ctx.db.patch(userId, { role: "admin", status: "active" });
    return { success: true, userId };
  },
});
