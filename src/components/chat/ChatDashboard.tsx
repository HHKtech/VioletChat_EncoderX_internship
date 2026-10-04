"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConnectionBanner } from "@/components/chat/ConnectionBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useTypingEmitter } from "@/hooks/useTypingEmitter";
import type { AuthUser, ConversationSummary, MessageItem, UserSummary } from "@/types/chat";

type LocalMessage = MessageItem & { status?: "sending" | "sent" | "failed" };

export function ChatDashboard({ initialUser }: { initialUser: AuthUser }) {
  const { user, logout } = useAuth();
  const { socket, connectionStatus, onlineUserIds } = useSocket();

  const currentUser = user ?? initialUser;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, LocalMessage[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [typingByConversation, setTypingByConversation] = useState<Record<number, { userId: number; name: string } | null>>({});
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeConversationIdRef = useRef<number | null>(null);
  activeConversationIdRef.current = activeConversationId;

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const conversationsWithPresence = useMemo(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        otherUser: { ...conversation.otherUser, online: onlineUserIds.has(conversation.otherUser.id) },
      })),
    [conversations, onlineUserIds],
  );

  const activeConversationWithPresence = useMemo(() => {
    if (!activeConversation) return null;
    return {
      ...activeConversation,
      otherUser: { ...activeConversation.otherUser, online: onlineUserIds.has(activeConversation.otherUser.id) },
    };
  }, [activeConversation, onlineUserIds]);

  const { notifyTyping, stopTyping } = useTypingEmitter(socket, activeConversationId);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const response = await fetch("/api/conversations", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load conversations");
      const data = (await response.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations);
    } catch {
      setConversationsError("Could not load your conversations. Pull to refresh or try again.");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Search people (debounced).
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users?query=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { users: UserSummary[] };
        setSearchResults(data.users);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadMessages = useCallback(async (conversationId: number) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load messages");
      const data = (await response.json()) as { messages: MessageItem[] };
      setMessagesByConversation((previous) => ({ ...previous, [conversationId]: data.messages }));
    } catch {
      setMessagesError("Could not load message history for this conversation.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const selectConversation = useCallback(
    (conversationId: number) => {
      if (activeConversationIdRef.current === conversationId) {
        setMobileShowChat(true);
        return;
      }

      if (activeConversationIdRef.current && socket) {
        socket.emit("leave_conversation", { conversationId: activeConversationIdRef.current });
      }
      stopTyping();

      setActiveConversationId(conversationId);
      setMobileShowChat(true);
      setSearchQuery("");

      if (!messagesByConversation[conversationId]) {
        void loadMessages(conversationId);
      }

      if (socket) {
        socket.emit("join_conversation", { conversationId }, (response) => {
          if (!response.ok) {
            setMessagesError(response.error);
          }
        });
      }
    },
    [socket, messagesByConversation, loadMessages, stopTyping],
  );

  // (Re)join the active conversation's room whenever the socket (re)connects.
  useEffect(() => {
    if (!socket || connectionStatus !== "connected" || !activeConversationId) return;
    socket.emit("join_conversation", { conversationId: activeConversationId }, (response) => {
      if (!response.ok) setMessagesError(response.error);
    });
  }, [socket, connectionStatus, activeConversationId]);

  const startConversationWithUser = useCallback(
    async (targetUser: UserSummary) => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: targetUser.id }),
        });
        if (!response.ok) throw new Error("Failed to start conversation");
        const data = (await response.json()) as { conversation: { id: number } };

        setConversations((previous) => {
          if (previous.some((c) => c.id === data.conversation.id)) return previous;
          return [
            {
              id: data.conversation.id,
              otherUser: targetUser,
              lastMessage: null,
              updatedAt: new Date().toISOString(),
            },
            ...previous,
          ];
        });

        setSearchQuery("");
        selectConversation(data.conversation.id);
      } catch {
        setConversationsError("Could not start a conversation with this user.");
      }
    },
    [selectConversation],
  );

  // Global, single-instance listeners for real-time events. Cleaned up on
  // unmount / socket change to avoid duplicate handlers.
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: MessageItem) {
      setMessagesByConversation((previous) => {
        const existing = previous[message.conversationId] ?? [];
        if (existing.some((m) => m.id === message.id)) return previous;
        return {
          ...previous,
          [message.conversationId]: [...existing, { ...message, status: "sent" as const }],
        };
      });

      setConversations((previous) => {
        const updated = previous.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                },
                updatedAt: message.createdAt,
              }
            : conversation,
        );
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });

      if (message.conversationId !== activeConversationIdRef.current) return;
      setTypingByConversation((previous) => ({ ...previous, [message.conversationId]: null }));
    }

    function handleTypingStart(payload: { conversationId: number; userId: number; name: string }) {
      setTypingByConversation((previous) => ({
        ...previous,
        [payload.conversationId]: { userId: payload.userId, name: payload.name },
      }));
    }

    function handleTypingStop(payload: { conversationId: number; userId: number }) {
      setTypingByConversation((previous) => {
        const current = previous[payload.conversationId];
        if (!current || current.userId !== payload.userId) return previous;
        return { ...previous, [payload.conversationId]: null };
      });
    }

    socket.on("new_message", handleNewMessage);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !socket) return;
      const conversationId = activeConversationId;
      const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticMessage: LocalMessage = {
        id: -Date.now(),
        clientId,
        conversationId,
        senderId: currentUser.id,
        receiverId: activeConversation?.otherUser.id ?? 0,
        content,
        createdAt: new Date().toISOString(),
        sender: { id: currentUser.id, name: currentUser.name },
        status: "sending",
      };

      setMessagesByConversation((previous) => ({
        ...previous,
        [conversationId]: [...(previous[conversationId] ?? []), optimisticMessage],
      }));

      socket.emit("send_message", { conversationId, content }, (response) => {
        setMessagesByConversation((previous) => {
          const existing = previous[conversationId] ?? [];
          const withoutTemp = existing.filter((m) => m.clientId !== clientId);

          if (!response.ok) {
            const failed = existing.find((m) => m.clientId === clientId);
            if (!failed) return previous;
            return {
              ...previous,
              [conversationId]: existing.map((m) =>
                m.clientId === clientId ? { ...m, status: "failed" as const } : m,
              ),
            };
          }

          if (withoutTemp.some((m) => m.id === response.message.id)) {
            return { ...previous, [conversationId]: withoutTemp };
          }

          return {
            ...previous,
            [conversationId]: [...withoutTemp, { ...response.message, status: "sent" as const }],
          };
        });

        if (!response.ok) {
          setConversationsError(null);
        }
      });
    },
    [activeConversationId, socket, currentUser, activeConversation],
  );

  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];
  const activeTyping = activeConversationId ? typingByConversation[activeConversationId] ?? null : null;

  return (
    <div className="flex h-dvh flex-col bg-[#fbf7ff]">
      <ConnectionBanner status={connectionStatus} />

      {conversationsError && (
        <div className="flex items-center gap-2 bg-crimson-50 px-4 py-2 text-xs text-crimson-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {conversationsError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div
          className={`w-full shrink-0 border-r border-violet-100 md:block md:w-[340px] ${
            mobileShowChat ? "hidden" : "block"
          }`}
        >
          <Sidebar
            currentUser={currentUser}
            conversations={conversationsWithPresence}
            conversationsLoading={conversationsLoading}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            onStartConversation={startConversationWithUser}
            onLogout={() => void logout()}
          />
        </div>

        <div className={`min-w-0 flex-1 ${mobileShowChat ? "block" : "hidden"} md:block`}>
          <ChatWindow
            conversation={activeConversationWithPresence}
            messages={activeMessages}
            currentUserId={currentUser.id}
            typingUserName={activeTyping?.name ?? null}
            isLoadingMessages={messagesLoading}
            messagesError={messagesError}
            isSendDisabled={connectionStatus !== "connected"}
            onSend={sendMessage}
            onTyping={notifyTyping}
            onStopTyping={stopTyping}
            onBack={() => setMobileShowChat(false)}
          />
        </div>
      </div>
    </div>
  );
}
