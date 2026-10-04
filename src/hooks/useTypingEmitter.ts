import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket/events";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const TYPING_STOP_DELAY_MS = 1800;

/**
 * Emits typing_start/typing_stop for the given conversation, automatically
 * stopping after a short pause in keystrokes, and always stopping on
 * unmount or conversation change so indicators never get stuck.
 */
export function useTypingEmitter(socket: AppSocket | null, conversationId: number | null) {
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopTyping = useCallback(() => {
    clearTimer();
    if (isTypingRef.current && socket && conversationId) {
      socket.emit("typing_stop", { conversationId });
    }
    isTypingRef.current = false;
  }, [socket, conversationId, clearTimer]);

  const notifyTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing_start", { conversationId });
    }

    clearTimer();
    timeoutRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
  }, [socket, conversationId, clearTimer, stopTyping]);

  // Stop typing whenever the conversation changes or the component unmounts.
  useEffect(() => {
    return () => {
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { notifyTyping, stopTyping };
}
