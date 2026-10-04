import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-crimson-100 text-brand-600">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="max-w-xs text-sm text-slate-500">{description}</p>
    </div>
  );
}
