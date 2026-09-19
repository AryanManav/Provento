import Link from "next/link";
import { BellRing } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import type { NotificationView } from "@/lib/types/domain";

/** "What changed since you last looked" — the unread feed, on a dashboard. */
export function UpdatesPanel({
  items,
  emptyText,
}: {
  items: NotificationView[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white">
      <div className="flex items-center gap-fib4 border-b border-line px-fib6 py-fib5">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            items.length > 0 ? "bg-accent-50 text-accent-600" : "bg-ink-100 text-ink-400"
          )}
        >
          <BellRing className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">What&apos;s new</h2>
          <p className="text-xs text-ink-500">
            {items.length > 0
              ? "Since you last looked — open one to act on it."
              : "Nothing needs you right now."}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="px-fib6 py-fib6 text-sm text-ink-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const content = (
              <>
                <NotificationIcon type={item.type} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-900">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-ink-500">
                    {item.message}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-400">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.linkUrl ? (
                  <Link
                    href={item.linkUrl}
                    className="flex items-center gap-fib4 px-fib6 py-fib4 transition-colors hover:bg-ink-50"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-fib4 px-fib6 py-fib4">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
