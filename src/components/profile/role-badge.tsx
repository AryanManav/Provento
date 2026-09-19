import { cn } from "@/lib/utils";
import type { ProfileRole } from "@/lib/types/domain";

const LABEL: Record<ProfileRole, string> = {
  candidate: "Candidate",
  company: "Company",
};

/**
 * Which side of the marketplace an identity is on. Deliberately unlike status
 * and skill badges: small caps, letter-spaced, a solid neutral fill for
 * companies and an outline for candidates, so the two read apart at a glance
 * and never as a state.
 */
export function RoleBadge({
  role,
  size = "default",
  className,
}: {
  role: ProfileRole;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded font-semibold uppercase tracking-[0.08em]",
        size === "sm"
          ? "px-1 py-px text-[9px] leading-3"
          : "px-1.5 py-0.5 text-[10px] leading-4",
        role === "company"
          ? "bg-ink-800 text-white"
          : "border border-ink-300 bg-white text-ink-700",
        className
      )}
    >
      {LABEL[role]}
    </span>
  );
}
