import { and, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export interface PublicUserSummary {
  id: number;
  name: string;
  email: string;
}

/**
 * Returns all users except the current one, optionally filtered by a
 * case-insensitive search on name or email. Never selects the password hash.
 */
export async function searchUsers(
  currentUserId: number,
  query: string,
): Promise<PublicUserSummary[]> {
  const trimmed = query.trim();

  const whereClause =
    trimmed.length > 0
      ? and(
          ne(users.id, currentUserId),
          or(ilike(users.name, `%${trimmed}%`), ilike(users.email, `%${trimmed}%`)),
        )
      : ne(users.id, currentUserId);

  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(whereClause)
    .orderBy(users.name)
    .limit(50);
}
