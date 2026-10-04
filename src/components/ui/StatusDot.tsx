interface StatusDotProps {
  online: boolean;
  label?: boolean;
}

export function StatusDot({ online, label = true }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"} ${
          online ? "animate-pulse-dot" : ""
        }`}
      />
      {label && <span className={online ? "text-emerald-600" : "text-slate-400"}>{online ? "Online" : "Offline"}</span>}
    </span>
  );
}
