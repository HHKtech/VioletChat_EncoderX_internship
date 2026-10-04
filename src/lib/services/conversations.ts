import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversationParticipants, conversations, messages, users } from "@/db/schema";

/**
 * Finds the existing 1:1 conversation between two users or creates a new one
 * (with both participant rows) inside a transaction. The pair is always
 * stored with the smaller id first, and a unique index on (user1Id, user2Id)
 * guarantees two users can never end up with duplicate conversations even
 * under concurrent requests.
 */
export async function findOrCreateConversation(userIdA: number, userIdB: number) {
  if (userIdA === userIdB) {
    throw new Error("Cannot create a conversation with yourself");
  }

  const user1Id = Math.min(userIdA, userIdB);
  const user2Id = Math.max(userIdA, userIdB);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(conversations)
      .where(and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await tx
      .insert(conversations)
      .values({ user1Id, user2Id })
      .returning();

    await tx.insert(conversationParticipants).values([
      { conversationId: created.id, userId: user1Id },
      { conversationId: created.id, userId: user2Id },
    ]);

    return created;
  });
}

/**
 * Authoritative server-side membership check used before allowing a user to
 * join a Socket.IO room, fetch history, or send a message in a conversation.
 */
export async function isConversationParticipant(
  conversationId: number,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: conversationParticipants.id })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function getOtherParticipantId(
  conversationId: number,
  userId: number,
): Promise<number | null> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) return null;
  if (conversation.user1Id === userId) return conversation.user2Id;
  if (conversation.user2Id === userId) return conversation.user1Id;
  return null;
}

export interface ConversationSummary {
  id: number;
  otherUser: { id: number; name: string; email: string };
  lastMessage: { content: string; createdAt: Date; senderId: number } | null;
  updatedAt: Date;
}

/**
 * Lists every conversation the given user participates in, including the
 * other participant's public info and the most recent message for preview.
 */
export async function listConversationsForUser(
  userId: number,
): Promise<ConversationSummary[]> {
  const rows = await db
    .select()
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversationParticipants.conversationId, conversations.id),
    )
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(desc(conversations.updatedAt));

  const summaries: ConversationSummary[] = [];

  for (const row of rows) {
    const conversation = row.conversations;
    const otherUserId =
      conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    const [otherUser] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    if (!otherUser) continue;

    const [lastMessage] = await db
      .select({
        content: messages.content,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    summaries.push({
      id: conversation.id,
      otherUser,
      lastMessage: lastMessage ?? null,
      updatedAt: conversation.updatedAt,
    });
  }

  return summaries;
}
