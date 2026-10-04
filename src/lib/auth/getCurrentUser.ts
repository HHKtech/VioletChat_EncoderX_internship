import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifyAuthToken } from "@/lib/auth/jwt";

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

/**
 * Reads the httpOnly auth cookie (server-side only), verifies the JWT, and
 * loads the corresponding user from the database. Never returns the
 * password hash. Returns null if unauthenticated or the token is invalid.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    return user ?? null;
  } catch {
    return null;
  }
}
