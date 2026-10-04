import { AlertTriangle, Check, Clock } from "lucide-react";
import { formatMessageTime } from "@/lib/utils/date";
import type { MessageItem } from "@/types/chat";

interface MessageBubbleProps {
  message: MessageItem & { status?: "sending" | "sent" | "failed" };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex animate-fade-in-up ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[65%] ${
          isOwn
            ? "rounded-br-md bg-gradient-to-br from-brand-600 to-crimson-600 text-white"
            : "rounded-bl-md border border-violet-100 bg-white text-slate-800"
        } ${message.status === "failed" ? "opacity-70 ring-1 ring-crimson-400" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? "text-white/70" : "text-slate-400"
          }`}
        >
          {message.status === "failed" ? (
            <span className="flex items-center gap-1 text-crimson-100">
              <AlertTriangle className="h-3 w-3" /> Failed to send
            </span>
          ) : message.status === "sending" ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Sending...
            </span>
          ) : (
            <>
              <span>{formatMessageTime(message.createdAt)}</span>
              {isOwn && <Check className="h-3 w-3" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
