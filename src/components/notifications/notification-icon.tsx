import {
  Bell,
  ClipboardCheck,
  FileUp,
  MessageSquare,
  Star,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationView } from "@/lib/types/domain";

const ICONS: Record<NotificationView["type"], { icon: LucideIcon; tone: string }> = {
  application_received: { icon: UserPlus, tone: "bg-brand-50 text-brand-600" },
  application_withdrawn: { icon: UserMinus, tone: "bg-ink-100 text-ink-500" },
  application_status: { icon: UserCheck, tone: "bg-emerald-50 text-emerald-600" },
  work_submitted: { icon: FileUp, tone: "bg-amber-50 text-amber-600" },
  submission_status: { icon: ClipboardCheck, tone: "bg-emerald-50 text-emerald-600" },
  message: { icon: MessageSquare, tone: "bg-violet-50 text-violet-600" },
  feedback: { icon: Star, tone: "bg-amber-50 text-amber-600" },
  outcome: { icon: Trophy, tone: "bg-emerald-50 text-emerald-600" },
  other: { icon: Bell, tone: "bg-ink-100 text-ink-500" },
};

export function NotificationIcon({
  type,
  className,
}: {
  type: NotificationView["type"];
  className?: string;
}) {
  const { icon: Icon, tone } = ICONS[type];
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        tone,
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
