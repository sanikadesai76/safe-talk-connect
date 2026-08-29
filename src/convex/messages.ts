import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Only participants can send messages
    if (conversation.seekerId !== userId && conversation.listenerId !== userId) {
      throw new Error("Unauthorized");
    }

    if (conversation.status !== "active") {
      throw new Error("Conversation is not active");
    }

    const user = await ctx.db.get(userId);
    const senderName = user?.anonymousName || "Anonymous";

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      senderAnonymousName: senderName,
      content: args.content.trim(),
      timestamp: Date.now(),
    });

    return { messageId };
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Only participants can read messages
    if (conversation.seekerId !== userId && conversation.listenerId !== userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return messages;
  },
});

export const getMessagesForConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (conversation.seekerId !== userId && conversation.listenerId !== userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return messages.map((m) => ({
      _id: m._id,
      senderId: m.senderId,
      senderAnonymousName: m.senderAnonymousName,
      content: m.content,
      timestamp: m.timestamp,
      isSystem: m.isSystem,
      isOwn: m.senderId === userId,
    }));
  },
});
