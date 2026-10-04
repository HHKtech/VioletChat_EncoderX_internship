"use client";

import { LogOut, Search, Sparkles, Users as UsersIcon, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ConversationListItem } from "@/components/chat/ConversationListItem";
import { EmptyState } from "@/components/chat/EmptyState";
import type { AuthUser, ConversationSummary, UserSummary } from "@/types/chat";

interface SidebarProps {
  className?: string;
  currentUser: AuthUser;
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchResults: UserSummary[];
  isSearching: boolean;
  onStartConversation: (user: UserSummary) => void;
  onLogout: () => void;
}

export function Sidebar({
  className = "",
  currentUser,
  conversations,
  conversationsLoading,
  activeConversationId,
  onSelectConversation,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  onStartConversation,
  onLogout,
}: SidebarProps) {
  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <aside className={`flex h-full w-full flex-col bg-white/70 backdrop-blur ${className}`}>
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-crimson-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">VioletChat</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-crimson-50 hover:text-crimson-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-50 to-crimson-50 px-3 py-2.5 ring-1 ring-brand-100">
        <Avatar name={currentUser.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{currentUser.name}</p>
          <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search people by name or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        {isSearchMode ? (
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {isSearching ? "Searching..." : `People (${searchResults.length})`}
            </p>
            {!isSearching && searchResults.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">No users found.</p>
            )}
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onStartConversation(user)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-violet-50"
              >
                <Avatar name={user.name} online={user.online} showStatus />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        ) : conversationsLoading ? (
          <div className="space-y-2 px-2.5 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-violet-50" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No conversations yet"
            description="Search for a teammate above to start your first chat."
          />
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                currentUserId={currentUser.id}
                onSelect={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
