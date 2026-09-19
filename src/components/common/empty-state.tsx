import Link from "next/link";
import { FolderOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  /** Smaller padding, for empty lists inside a card. */
  compact?: boolean;
  className?: string;
}

/** What's missing, why, and the one thing to do about it. */
export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  actionHref,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white text-center",
        compact ? "px-6 py-8" : "px-6 py-12",
        className
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-ink-50 text-ink-400">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref} className="mt-4">
          <Button size="sm" variant="outline">
            {actionText}
          </Button>
        </Link>
      )}
    </div>
  );
}
