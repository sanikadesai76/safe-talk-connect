import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const findListener = mutation({
  args: {
    categories: v.array(v.string()),
    anonymousName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.status === "suspended" || user?.status === "banned") {
      throw new Error("Account is not active");
    }

    // Check for existing active conversation
    const activeConv = await ctx.db
      .query("conversations")
      .withIndex("by_seeker_status", (q) =>
        q.eq("seekerId", userId).eq("status", "active")
      )
      .first();
    if (activeConv) throw new Error("Already in an active conversation");

    // Check for blocked pairs
    const blockedBySeeker = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect();

    // Get all approved, available listeners
    const availableListeners = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_approval_availability", (q) =>
        q.eq("approvalStatus", "approved").eq("availability", "available")
      )
      .collect();

    // Filter out blocked listeners and listeners with max concurrent conversations
    const eligibleListeners = availableListeners.filter((l) => {
      const isBlocked = blockedBySeeker.some(
        (b) => b.blockedId === l.userId
      );
      if (isBlocked) return false;
      if ((l.activeConversations || 0) >= 3) return false;
      // Check for existing active conversation between these two
      return true;
    });

    // Sort by: fewer active conversations, better rating, more total conversations
    const scored = eligibleListeners.map((l) => ({
      ...l,
      score:
        -(l.activeConversations || 0) * 10 +
        (l.avgRating || 3) * 5 +
        Math.min(l.totalConversations || 0, 50) * 0.1,
    }));
    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      // Add to waiting queue
      const queueId = await ctx.db.insert("waitingQueue", {
        seekerId: userId,
        anonymousName: args.anonymousName,
        categories: args.categories,
        status: "waiting",
        createdAt: Date.now(),
      });
      return { matched: false, queueId };
    }

    // Match with best listener
    const bestListener = scored[0];
    const listenerUser = await ctx.db.get(bestListener.userId);
    const listenerAnonName = listenerUser?.anonymousName || "Anonymous";

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      seekerId: userId,
      listenerId: bestListener.userId,
      seekerAnonymousName: args.anonymousName,
      listenerAnonymousName: listenerAnonName,
      status: "active",
      seekerCategories: args.categories,
      createdAt: Date.now(),
    });

    // Update listener active count
    await ctx.db.patch(bestListener._id, {
      activeConversations: (bestListener.activeConversations || 0) + 1,
    });

    // Add system message
    await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      senderAnonymousName: "Sathiii",
      content: "You've been matched! This is a safe, anonymous space. Take your time.",
      timestamp: Date.now(),
      isSystem: true,
    });

    return { matched: true, conversationId, listenerAnonName };
  },
});

export const getMyActiveConversation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check as seeker
    const asSeeker = await ctx.db
      .query("conversations")
      .withIndex("by_seeker_status", (q) =>
        q.eq("seekerId", userId).eq("status", "active")
      )
      .first();
    if (asSeeker) return { ...asSeeker, role: "seeker" };

    // Check as listener
    const asListener = await ctx.db
      .query("conversations")
      .withIndex("by_listener_status", (q) =>
        q.eq("listenerId", userId).eq("status", "active")
      )
      .first();
    if (asListener) return { ...asListener, role: "listener" };

    return null;
  },
});

export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const asSeeker = await ctx.db
      .query("conversations")
      .withIndex("by_seeker", (q) => q.eq("seekerId", userId))
      .order("desc")
      .collect();

    const asListener = await ctx.db
      .query("conversations")
      .withIndex("by_listener", (q) => q.eq("listenerId", userId))
      .order("desc")
      .collect();

    // Deduplicate and tag role
    const all = [
      ...asSeeker.map((c) => ({ ...c, myRole: "seeker" as const })),
      ...asListener.map((c) => ({ ...c, myRole: "listener" as const })),
    ];

    // Deduplicate by conversation id
    const seen = new Set<string>();
    return all.filter((c) => {
      if (seen.has(c._id)) return false;
      seen.add(c._id);
      return true;
    });
  },
});

export const endConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Only participants can end
    if (conversation.seekerId !== userId && conversation.listenerId !== userId) {
      throw new Error("Unauthorized");
    }

    if (conversation.status !== "active") {
      throw new Error("Conversation is not active");
    }

    const endedBy = conversation.seekerId === userId ? "seeker" : "listener";

    await ctx.db.patch(args.conversationId, {
      status: "ended",
      endedAt: Date.now(),
      endedBy,
    });

    // Update listener active count
    const listenerProfile = await ctx.db
      .query("listenerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", conversation.listenerId))
      .first();
    if (listenerProfile) {
      await ctx.db.patch(listenerProfile._id, {
        activeConversations: Math.max(0, (listenerProfile.activeConversations || 1) - 1),
        totalConversations: (listenerProfile.totalConversations || 0) + 1,
      });
    }

    // Add system message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      senderAnonymousName: "Sathiii",
      content: "This conversation has ended. Thank you for connecting.",
      timestamp: Date.now(),
      isSystem: true,
    });

    return { success: true };
  },
});

export const getWaitingQueueCount = query({
  args: {},
  handler: async (ctx) => {
    const waiting = await ctx.db
      .query("waitingQueue")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
    return waiting.length;
  },
});
