// Shared Socket.IO event contracts used by both the server (src/server) and
// the browser client (src/hooks, src/components). Keeping these in one file
// guarantees the two sides never drift out of sync.

export interface SocketMessagePayload {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  sender: { id: number; name: string };
}

export interface AckError {
  ok: false;
  error: string;
}

export interface JoinConversationAck {
  ok: true;
  conversationId: number;
}

export interface SendMessageAck {
  ok: true;
  message: SocketMessagePayload;
}

export interface ServerToClientEvents {
  new_message: (message: SocketMessagePayload) => void;
  user_online: (payload: { userId: number }) => void;
  user_offline: (payload: { userId: number }) => void;
  typing_start: (payload: { conversationId: number; userId: number; name: string }) => void;
  typing_stop: (payload: { conversationId: number; userId: number }) => void;
  presence_snapshot: (payload: { onlineUserIds: number[] }) => void;
  error_message: (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_conversation: (
    payload: { conversationId: number },
    callback: (response: JoinConversationAck | AckError) => void,
  ) => void;
  leave_conversation: (payload: { conversationId: number }) => void;
  send_message: (
    payload: { conversationId: number; content: string },
    callback: (response: SendMessageAck | AckError) => void,
  ) => void;
  typing_start: (payload: { conversationId: number }) => void;
  typing_stop: (payload: { conversationId: number }) => void;
}

// No server-to-server events in this single-process deployment.
export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: {
    id: number;
    name: string;
    email: string;
  };
}
