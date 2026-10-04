export interface AuthUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  online: boolean;
}

export interface ConversationSummary {
  id: number;
  otherUser: UserSummary;
  lastMessage: { content: string; createdAt: string; senderId: number } | null;
  updatedAt: string;
}

export interface MessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  sender: { id: number; name: string };
  /** Present only for optimistic (not-yet-confirmed) messages created client-side. */
  clientId?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";
