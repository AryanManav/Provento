import { BriefcaseBusiness, Hammer } from "lucide-react";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OpportunityType } from "@/lib/types/database.types";

/**
 * What kind of opportunity this is — HIRE ONLY (a role) or BUILD ONLY (a paid
 * project). Distinct from RoleBadge, which says who someone is: this one
 * carries an icon and a tint, so the two never read as the same label.
 */
export function OpportunityBadge({
  type,
  size = "default",
  className,
}: {
  type: OpportunityType;
  size?: "default" | "sm";
  className?: string;
}) {
  const Icon = type === "hire" ? BriefcaseBusiness : Hammer;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border font-semibold uppercase tracking-[0.06em]",
        size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]",
        type === "hire"
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-brand-200 bg-brand-50 text-brand-800",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {OPPORTUNITY_TYPES[type].label}
    </span>
  );
}
