import {
  AlertCircle,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/status";

export type { StatusTone };

/**
 * Every badge pairs its colour with an icon and a text label, so no status
 * relies on colour alone. Tones are defined in `lib/status`.
 */
const TONE_STYLES: Record<StatusTone, { className: string; icon: LucideIcon }> = {
  neutral: { className: "border-ink-200 bg-ink-50 text-ink-600", icon: Circle },
  info: { className: "border-sky-200 bg-sky-50 text-sky-700", icon: Info },
  active: { className: "border-brand-200 bg-brand-50 text-brand-700", icon: CircleDot },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-800", icon: Clock },
  attention: {
    className: "border-accent-200 bg-accent-50 text-accent-800",
    icon: AlertCircle,
  },
  success: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  danger: { className: "border-rose-200 bg-rose-50 text-rose-700", icon: XCircle },
};

export function StatusBadge({
  tone,
  label,
  icon,
  size = "default",
  className,
}: {
  tone: StatusTone;
  label: string;
  /** Overrides the tone's default icon. */
  icon?: LucideIcon;
  size?: "default" | "sm";
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  const Icon = icon ?? style.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border font-medium",
        size === "sm" ? "px-1.5 py-px text-2xs" : "px-2 py-0.5 text-xs",
        style.className,
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {label}
    </span>
  );
}

/** A dot for dense lists where a full badge is too heavy; still labelled. */
export function StatusDot({ tone, label }: { tone: StatusTone; label: string }) {
  const dot: Record<StatusTone, string> = {
    neutral: "bg-ink-400",
    info: "bg-sky-500",
    active: "bg-brand-500",
    warning: "bg-amber-500",
    attention: "bg-accent-500",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} aria-hidden />
      {label}
    </span>
  );
}
