import { cn } from "@/lib/utils";

/** A small count pill; renders nothing at zero. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-bold leading-none text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
