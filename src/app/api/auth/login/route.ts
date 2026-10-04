import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { setAuthCookie } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Use an identical generic error for unknown email vs. wrong password so
  // the API never reveals which part of the credential pair was incorrect.
  const genericError = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!user) return genericError;

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return genericError;

  const token = signAuthToken({ sub: user.id, email: user.email, name: user.name });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  });
  setAuthCookie(response, token);
  return response;
}
