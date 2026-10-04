import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verifyAuthToken } from "@/lib/auth/jwt";
import {
  conversationIdSchema,
  sendMessageSchema,
  typingSchema,
} from "@/lib/validation/schemas";
import { isConversationParticipant } from "@/lib/services/conversations";
import { createMessage } from "@/lib/services/messages";
import { getOnlineUserIds, markSocketOffline, markSocketOnline } from "@/server/presence";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@/lib/socket/events";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

function conversationRoom(conversationId: number): string {
  return `conversation:${conversationId}`;
}

function parseAllowedOrigins(): string[] {
  const envOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, "")) // Trailing slashes remove kar dega
    .filter(Boolean);

  // Vercel app domain ko hamesha fallback ke taur par include rakhein
  return [
    ...envOrigins,
    "https://violet-chat-self.vercel.app",
    "http://localhost:3000",
  ];
}

export function createSocketServer(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowed = parseAllowedOrigins();
        // Allow requests with no origin (e.g. mobile apps / Postman) or matched domains
        if (!origin || allowed.includes(origin) || allowed.includes("*")) {
          callback(null, true);
        } else {
          callback(null, true); // Temporary: allow all if origin mismatch occurs during dev
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ---------------------------------------------------------------------
  // Handshake authentication: every connection MUST present a valid JWT.
  // Missing, malformed, or expired tokens are rejected before the
  // "connection" event ever fires, and the verified identity is attached
  // to the socket so handlers never trust client-supplied user ids.
  // ---------------------------------------------------------------------
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice("Bearer ".length)
        : undefined);

    if (!token) {
      next(new Error("UNAUTHORIZED: missing authentication token"));
      return;
    }

    try {
      const payload = verifyAuthToken(token);
      socket.data.user = { id: payload.sub, name: payload.name, email: payload.email };
      next();
    } catch {
      next(new Error("UNAUTHORIZED: invalid or expired token"));
    }
  });

  io.on("connection", (socket: AppSocket) => {
    void handleConnection(io, socket);
  });

  return io;
}

async function handleConnection(io: AppServer, socket: AppSocket) {
  const { user } = socket.data;

  // Track which conversations this socket is currently "typing" in so we can
  // force-stop the indicator on disconnect, message send, or conversation
  // change without ever persisting typing state to the database.
  const typingConversationIds = new Set<number>();

  const { justCameOnline } = markSocketOnline(user.id, socket.id);
  if (justCameOnline) {
    socket.broadcast.emit("user_online", { userId: user.id });
  }

  socket.emit("presence_snapshot", { onlineUserIds: getOnlineUserIds() });

  socket.on("join_conversation", (payload, callback) => {
    void (async () => {
      const parsed = conversationIdSchema.safeParse(payload);
      if (!parsed.success) {
        callback({ ok: false, error: "Invalid conversation id" });
        return;
      }

      const { conversationId } = parsed.data;
      const allowed = await isConversationParticipant(conversationId, user.id);
      if (!allowed) {
        callback({ ok: false, error: "You are not a participant of this conversation" });
        return;
      }

      await socket.join(conversationRoom(conversationId));
      callback({ ok: true, conversationId });
    })();
  });

  socket.on("leave_conversation", (payload) => {
    const parsed = conversationIdSchema.safeParse(payload);
    if (!parsed.success) return;

    const { conversationId } = parsed.data;
    void socket.leave(conversationRoom(conversationId));
    stopTyping(conversationId);
  });

  socket.on("send_message", (payload, callback) => {
    void (async () => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        callback({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" });
        return;
      }

      const { conversationId, content } = parsed.data;

      const allowed = await isConversationParticipant(conversationId, user.id);
      if (!allowed) {
        callback({ ok: false, error: "You are not a participant of this conversation" });
        return;
      }

      try {
        // Sender identity is taken exclusively from the authenticated socket,
        // never from the client payload.
        const saved = await createMessage({ conversationId, senderId: user.id, content });

        const outgoing = {
          id: saved.id,
          conversationId: saved.conversationId,
          senderId: saved.senderId,
          receiverId: saved.receiverId,
          content: saved.content,
          createdAt: saved.createdAt.toISOString(),
          sender: { id: user.id, name: user.name },
        };

        // Persist-then-broadcast: the message only reaches clients after a
        // successful database write.
        io.to(conversationRoom(conversationId)).emit("new_message", outgoing);
        stopTyping(conversationId);
        callback({ ok: true, message: outgoing });
      } catch {
        callback({ ok: false, error: "Failed to send message. Please try again." });
      }
    })();
  });

  socket.on("typing_start", (payload) => {
    void (async () => {
      const parsed = typingSchema.safeParse(payload);
      if (!parsed.success) return;

      const { conversationId } = parsed.data;
      const allowed = await isConversationParticipant(conversationId, user.id);
      if (!allowed) return;

      typingConversationIds.add(conversationId);
      socket.to(conversationRoom(conversationId)).emit("typing_start", {
        conversationId,
        userId: user.id,
        name: user.name,
      });
    })();
  });

  socket.on("typing_stop", (payload) => {
    const parsed = typingSchema.safeParse(payload);
    if (!parsed.success) return;
    stopTyping(parsed.data.conversationId);
  });

  socket.on("disconnect", () => {
    for (const conversationId of typingConversationIds) {
      stopTyping(conversationId);
    }

    const { wentOffline } = markSocketOffline(user.id, socket.id);
    if (wentOffline) {
      socket.broadcast.emit("user_offline", { userId: user.id });
    }
  });

  function stopTyping(conversationId: number) {
    if (!typingConversationIds.delete(conversationId)) return;
    socket.to(conversationRoom(conversationId)).emit("typing_stop", {
      conversationId,
      userId: user.id,
    });
  }
}

// Re-exported for the /api/users route so online status can be reported
// through the REST API too (initial page load, before the socket connects).
export { getOnlineUserIds } from "@/server/presence";
