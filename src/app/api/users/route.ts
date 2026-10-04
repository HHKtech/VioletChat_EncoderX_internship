import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { searchUsers } from "@/lib/services/users";
import { searchUsersSchema } from "@/lib/validation/schemas";
import { isUserOnline } from "@/server/presence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchUsersSchema.safeParse({ query: searchParams.get("query") ?? undefined });
  const query = parsed.success ? parsed.data.query : "";

  const matches = await searchUsers(currentUser.id, query);
  const withPresence = matches.map((u) => ({ ...u, online: isUserOnline(u.id) }));

  return NextResponse.json({ users: withPresence });
}
