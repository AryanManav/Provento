import { cn } from "@/lib/utils";
import { STAGE_DISPLAY, type ApplicationStage } from "@/lib/applications";

const TONES = {
  neutral: "bg-ink-100 text-ink-700",
  info: "bg-brand-50 text-brand-700",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-rose-50 text-rose-700",
} as const;

export function ApplicationStageBadge({
  stage,
  className,
}: {
  stage: ApplicationStage;
  className?: string;
}) {
  const { label, tone } = STAGE_DISPLAY[stage];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-fib5 py-fib2 text-xs font-semibold",
        TONES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
