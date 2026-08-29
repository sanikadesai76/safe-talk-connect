import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: {
    conversationId: v.id("conversations"),
    stars: v.number(),
    feltHeard: v.string(),
    feelingNow: v.optional(v.string()),
    wouldTalkAgain: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.status !== "ended") throw new Error("Conversation must be ended first");

    // Check if already submitted
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .first();
    if (existing) throw new Error("Feedback already submitted");

    const ratingId = await ctx.db.insert("ratings", {
      conversationId: args.conversationId,
      userId,
      stars: args.stars,
      feltHeard: args.feltHeard,
      feelingNow: args.feelingNow,
      wouldTalkAgain: args.wouldTalkAgain,
      createdAt: Date.now(),
    });

    // Update listener's average rating
    if (conversation.listenerId) {
      const listenerProfile = await ctx.db
        .query("listenerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", conversation.listenerId))
        .first();
      if (listenerProfile) {
        // Get all conversations for this listener (indexed)
        const listenerConversations = await ctx.db
          .query("conversations")
          .withIndex("by_listener", (q) =>
            q.eq("listenerId", conversation.listenerId)
          )
          .collect();

        // Get ratings for each conversation (indexed by_conversation)
        const allListenerRatings: number[] = [];
        for (const conv of listenerConversations) {
          const convRatings = await ctx.db
            .query("ratings")
            .withIndex("by_conversation", (q) =>
              q.eq("conversationId", conv._id)
            )
            .collect();
          for (const r of convRatings) {
            allListenerRatings.push(r.stars);
          }
        }

        const avgRating =
          allListenerRatings.length > 0
            ? allListenerRatings.reduce((sum, s) => sum + s, 0) /
              allListenerRatings.length
            : args.stars;

        await ctx.db.patch(listenerProfile._id, {
          avgRating: Math.round(avgRating * 10) / 10,
        });
      }
    }

    return { ratingId };
  },
});

export const hasSubmittedFeedback = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", userId)
      )
      .first();

    return !!existing;
  },
});

export const getConversationRatings = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return ratings;
  },
});

export const getMyRatings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return ratings;
  },
});
