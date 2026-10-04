/**
 * In-memory presence tracking for a single Node.js process.
 *
 * Each authenticated user can have multiple active socket connections
 * (multiple tabs/devices). We only consider a user "offline" once their last
 * socket connection disconnects, so opening a second tab never incorrectly
 * flips an already-online user to offline when one of their tabs closes.
 */

const userIdToSocketIds = new Map<number, Set<string>>();

export function markSocketOnline(userId: number, socketId: string): { justCameOnline: boolean } {
  const existing = userIdToSocketIds.get(userId);
  if (existing) {
    const justCameOnline = existing.size === 0;
    existing.add(socketId);
    return { justCameOnline };
  }
  userIdToSocketIds.set(userId, new Set([socketId]));
  return { justCameOnline: true };
}

export function markSocketOffline(userId: number, socketId: string): { wentOffline: boolean } {
  const existing = userIdToSocketIds.get(userId);
  if (!existing) return { wentOffline: false };

  existing.delete(socketId);

  if (existing.size === 0) {
    userIdToSocketIds.delete(userId);
    return { wentOffline: true };
  }
  return { wentOffline: false };
}

export function isUserOnline(userId: number): boolean {
  const existing = userIdToSocketIds.get(userId);
  return Boolean(existing && existing.size > 0);
}

export function getOnlineUserIds(): number[] {
  return Array.from(userIdToSocketIds.keys());
}
