export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-violet-100" />
      <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-medium text-brand-700">
        {label}
      </span>
      <span className="h-px flex-1 bg-violet-100" />
    </div>
  );
}
