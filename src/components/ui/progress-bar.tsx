import { cn } from "@/lib/utils";

/** A labelled, accessible progress bar. `value` is 0–100. */
export function ProgressBar({
  value,
  label,
  tone = "brand",
  size = "default",
  className,
}: {
  value: number;
  label: string;
  tone?: "brand" | "success";
  size?: "default" | "sm";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-ink-100",
        size === "sm" ? "h-1" : "h-1.5",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "success" ? "bg-emerald-500" : "bg-brand-600"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
