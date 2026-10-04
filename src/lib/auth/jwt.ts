import jwt, { type SignOptions } from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: number;
  email: string;
  name: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is missing, malformed, expired, or has an invalid signature.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getSecret());
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as Record<string, unknown>).sub !== "number"
  ) {
    throw new Error("Invalid token payload");
  }
  return decoded as unknown as AuthTokenPayload;
}
