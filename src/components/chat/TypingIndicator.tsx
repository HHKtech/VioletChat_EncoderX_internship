export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
      </span>
      <span>{name} is typing...</span>
    </div>
  );
}
