import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifyAuthToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

/**
 * Returns the currently authenticated user plus the raw JWT so the browser
 * client can initialize its Socket.IO connection. The JWT itself already
 * lives in an httpOnly cookie (used for page/API auth); this endpoint only
 * hands the same token back to script running on behalf of the already
 * authenticated session, it never logs or exposes it anywhere else.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null, token: null }, { status: 401 });
  }

  try {
    const payload = verifyAuthToken(token);
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null, token: null }, { status: 401 });
    }

    return NextResponse.json({ user, token });
  } catch {
    return NextResponse.json({ user: null, token: null }, { status: 401 });
  }
}
