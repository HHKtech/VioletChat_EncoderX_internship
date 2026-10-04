import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isConversationParticipant } from "@/lib/services/conversations";
import { listMessages } from "@/lib/services/messages";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  // Server-side authorization: a user can only read messages from
  // conversations they are an explicit participant of.
  const allowed = await isConversationParticipant(conversationId, currentUser.id);
  if (!allowed) {
    return NextResponse.json({ error: "You do not have access to this conversation" }, { status: 403 });
  }

  const messages = await listMessages(conversationId);
  return NextResponse.json({ messages });
}
