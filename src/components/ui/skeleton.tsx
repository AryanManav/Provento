import { cn } from "@/lib/utils";

/** A placeholder block while content loads. Decorative: wrap groups in role="status". */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("animate-pulse rounded-md bg-ink-100", className)} />
  );
}
