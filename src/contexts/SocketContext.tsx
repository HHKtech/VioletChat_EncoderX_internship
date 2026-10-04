"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket/events";
import type { ConnectionStatus } from "@/types/chat";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: AppSocket | null;
  connectionStatus: ConnectionStatus;
  onlineUserIds: Set<number>;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, status } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const socketRef = useRef<AppSocket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnectionStatus("disconnected");
      setOnlineUserIds(new Set());
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? undefined;
    const instance: AppSocket = io(socketUrl, {
      path: "/socket.io",
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setConnectionStatus("connecting");

    instance.on("connect", () => {
      setConnectionStatus("connected");
    });

    instance.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    instance.io.on("reconnect_attempt", () => {
      setConnectionStatus("reconnecting");
    });

    instance.on("connect_error", () => {
      setConnectionStatus((previous) => (previous === "connected" ? previous : "disconnected"));
    });

    instance.on("presence_snapshot", ({ onlineUserIds: ids }) => {
      setOnlineUserIds(new Set(ids));
    });

    instance.on("user_online", ({ userId }) => {
      setOnlineUserIds((previous) => new Set(previous).add(userId));
    });

    instance.on("user_offline", ({ userId }) => {
      setOnlineUserIds((previous) => {
        const next = new Set(previous);
        next.delete(userId);
        return next;
      });
    });

    socketRef.current = instance;
    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token, status]);

  const value = useMemo(
    () => ({ socket, connectionStatus, onlineUserIds }),
    [socket, connectionStatus, onlineUserIds],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
