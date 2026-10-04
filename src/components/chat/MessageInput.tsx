"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { MESSAGE_MAX_LENGTH } from "@/lib/validation/schemas";

interface MessageInputProps {
  disabled: boolean;
  onSend: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function MessageInput({ disabled, onSend, onTyping, onStopTyping }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isSubmittingRef = useRef(false);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MESSAGE_MAX_LENGTH || disabled || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    onSend(trimmed);
    onStopTyping();
    setValue("");
    requestAnimationFrame(() => {
      resize();
      isSubmittingRef.current = false;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  const remaining = MESSAGE_MAX_LENGTH - value.length;
  const nearLimit = remaining <= 200;

  return (
    <form onSubmit={handleSubmit} className="border-t border-violet-100 bg-white/80 p-3 sm:p-4">
      {nearLimit && (
        <p className={`mb-1.5 text-right text-xs ${remaining < 0 ? "text-crimson-600" : "text-slate-400"}`}>
          {remaining} characters left
        </p>
      )}
      <div className="flex items-end gap-2 rounded-2xl border border-violet-100 bg-white px-3 py-2 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            resize();
            if (event.target.value.trim().length > 0) onTyping();
            else onStopTyping();
          }}
          onKeyDown={handleKeyDown}
          onBlur={onStopTyping}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? "Reconnecting..." : "Type a message..."}
          className="max-h-[140px] flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim() || value.trim().length > MESSAGE_MAX_LENGTH}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-crimson-600 text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
