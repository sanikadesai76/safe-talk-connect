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
    await ctx.db.patch(args.userId, { role: "admin" });
    return { success: true };
  },
});

const ADMIN_EMAIL = "sddesai1603@gmail.com";

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

    // If another admin already exists, block this
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();
    if (existingAdmin) return { adminExists: true };

    // Promote (works even if user already has seeker/listener role)
    await ctx.db.patch(userId, { role: "admin", status: "active" });
    return { success: true, userId };
  },
});
