import { STAGE_DISPLAY, type ApplicationStage } from "@/lib/applications";
import { StatusBadge } from "@/components/ui/status-badge";

export function ApplicationStageBadge({
  stage,
  size,
  className,
}: {
  stage: ApplicationStage;
  size?: "default" | "sm";
  className?: string;
}) {
  const { label, tone } = STAGE_DISPLAY[stage];
  return <StatusBadge tone={tone} label={label} size={size} className={className} />;
}
