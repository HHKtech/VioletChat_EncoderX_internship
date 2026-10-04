import { Avatar } from "@/components/ui/Avatar";
import { formatRelativePreviewTime } from "@/lib/utils/date";
import type { ConversationSummary } from "@/types/chat";

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  currentUserId: number;
  onSelect: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  currentUserId,
  onSelect,
}: ConversationListItemProps) {
  const { otherUser, lastMessage } = conversation;
  const previewPrefix = lastMessage?.senderId === currentUserId ? "You: " : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
        isActive ? "bg-gradient-to-r from-brand-50 to-crimson-50 ring-1 ring-brand-200" : "hover:bg-violet-50"
      }`}
    >
      <Avatar name={otherUser.name} online={otherUser.online} showStatus />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">{otherUser.name}</p>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-slate-400">
              {formatRelativePreviewTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500">
          {lastMessage ? `${previewPrefix}${lastMessage.content}` : "Start the conversation"}
        </p>
      </div>
    </button>
  );
}
