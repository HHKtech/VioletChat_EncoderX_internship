import { Loader2, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/types/chat";

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return null;

  const isReconnecting = status === "reconnecting" || status === "connecting";

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white ${
        isReconnecting ? "bg-amber-500" : "bg-crimson-600"
      }`}
    >
      {isReconnecting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {status === "connecting" ? "Connecting to VioletChat..." : "Connection lost. Reconnecting..."}
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          You are offline. Messages will not be delivered until reconnected.
        </>
      )}
    </div>
  );
}
