"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, MessageSquareText } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { StatusDot } from "@/components/ui/StatusDot";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { EmptyState } from "@/components/chat/EmptyState";
import { formatDateSeparator, isSameCalendarDay } from "@/lib/utils/date";
import type { ConversationSummary, MessageItem } from "@/types/chat";

interface ChatWindowProps {
  conversation: ConversationSummary | null;
  messages: (MessageItem & { status?: "sending" | "sent" | "failed" })[];
  currentUserId: number;
  typingUserName: string | null;
  isLoadingMessages: boolean;
  messagesError: string | null;
  isSendDisabled: boolean;
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  onBack: () => void;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  typingUserName,
  isLoadingMessages,
  messagesError,
  isSendDisabled,
  onSend,
  onTyping,
  onStopTyping,
  onBack,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const previousConversationId = useRef<number | null>(null);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    bottomRef.current?.scrollIntoView({ behavior });
  }

  useEffect(() => {
    if (!conversation) return;
    if (previousConversationId.current !== conversation.id) {
      previousConversationId.current = conversation.id;
      setIsAtBottom(true);
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
  }, [conversation, messages.length]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages.length, typingUserName, isAtBottom]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom < 120);
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#fbf7ff]">
        <EmptyState
          icon={MessageSquareText}
          title="Select a conversation"
          description="Choose a conversation from the sidebar or search for someone to start chatting."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-[#fbf7ff]">
      <header className="flex items-center gap-3 border-b border-violet-100 bg-white/80 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-violet-50 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={conversation.otherUser.name} online={conversation.otherUser.online} showStatus />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{conversation.otherUser.name}</p>
          <StatusDot online={conversation.otherUser.online} />
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 sm:px-6"
        >
          {isLoadingMessages ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-12 w-2/3 animate-pulse rounded-2xl bg-violet-100 ${i % 2 === 0 ? "" : "ml-auto"}`}
                />
              ))}
            </div>
          ) : messagesError ? (
            <div className="flex h-full items-center justify-center text-sm text-crimson-600">{messagesError}</div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No messages yet"
              description={`Send your first message to ${conversation.otherUser.name}.`}
            />
          ) : (
            <div className="space-y-1.5">
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const showSeparator = !previous || !isSameCalendarDay(previous.createdAt, message.createdAt);
                return (
                  <div key={message.clientId ?? message.id}>
                    {showSeparator && <DateSeparator label={formatDateSeparator(message.createdAt)} />}
                    <div className="py-0.5">
                      <MessageBubble message={message} isOwn={message.senderId === currentUserId} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!isAtBottom && (
          <button
            type="button"
            onClick={() => {
              setIsAtBottom(true);
              scrollToBottom("smooth");
            }}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-crimson-600 text-white shadow-lg transition hover:brightness-110"
            aria-label="Scroll to latest messages"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="h-6 px-2">{typingUserName && <TypingIndicator name={typingUserName} />}</div>

      <MessageInput
        disabled={isSendDisabled}
        onSend={onSend}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />
    </div>
  );
}
