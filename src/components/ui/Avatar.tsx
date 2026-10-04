interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  showStatus?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-16 w-16 text-xl",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", online, showStatus = false }: AvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-crimson-500 font-semibold text-white shadow-sm ${SIZE_CLASSES[size]}`}
      >
        {getInitials(name)}
      </span>
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            online ? "bg-emerald-500" : "bg-slate-300"
          }`}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}
