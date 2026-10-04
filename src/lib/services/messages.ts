import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { getOtherParticipantId } from "@/lib/services/conversations";

export interface PersistedMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date;
}

/**
 * Persists a message. The sender id MUST be derived server-side (from the
 * authenticated socket/session) by the caller - never trust a client-supplied
 * senderId. Also bumps the conversation's updatedAt for inbox ordering.
 */
export async function createMessage(params: {
  conversationId: number;
  senderId: number;
  content: string;
}): Promise<PersistedMessage> {
  const receiverId = await getOtherParticipantId(params.conversationId, params.senderId);
  if (!receiverId) {
    throw new Error("Conversation not found or sender is not a participant");
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(messages)
      .values({
        conversationId: params.conversationId,
        senderId: params.senderId,
        receiverId,
        content: params.content,
      })
      .returning();

    await tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, params.conversationId));

    return created;
  });
}

export interface MessageWithSender extends PersistedMessage {
  sender: { id: number; name: string };
}

export async function listMessages(conversationId: number): Promise<MessageWithSender[]> {
  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      content: messages.content,
      createdAt: messages.createdAt,
      senderName: users.name,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(500);

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    receiverId: row.receiverId,
    content: row.content,
    createdAt: row.createdAt,
    sender: { id: row.senderId, name: row.senderName },
  }));
}
