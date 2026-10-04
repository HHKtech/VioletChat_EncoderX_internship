import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createConversationSchema } from "@/lib/validation/schemas";
import { findOrCreateConversation, listConversationsForUser } from "@/lib/services/conversations";
import { isUserOnline } from "@/server/presence";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await listConversationsForUser(currentUser.id);
  const withPresence = conversations.map((conversation) => ({
    ...conversation,
    otherUser: { ...conversation.otherUser, online: isUserOnline(conversation.otherUser.id) },
  }));

  return NextResponse.json({ conversations: withPresence });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  if (parsed.data.userId === currentUser.id) {
    return NextResponse.json({ error: "You cannot start a conversation with yourself" }, { status: 400 });
  }

  try {
    const conversation = await findOrCreateConversation(currentUser.id, parsed.data.userId);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 400 });
  }
}
