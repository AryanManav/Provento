"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NOTIFICATION_POLL_MS } from "@/lib/constants";
import {
  markNotificationsRead,
  refreshNotifications,
  useNotificationSummary,
} from "@/components/notifications/notification-store";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { CountBadge } from "@/components/notifications/count-badge";
import type { NotificationSummary } from "@/lib/types/domain";

export function NotificationBell({ initial }: { initial: NotificationSummary }) {
  const summary = useNotificationSummary(initial);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(initial.unreadCount);

  // Poll while the tab is visible, and re-check on focus and on navigation.
  // When something new arrives, refresh the page so its highlights update too.
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const next = await refreshNotifications();
      if (next && next.unreadCount > lastCount.current) router.refresh();
      if (next) lastCount.current = next.unreadCount;
    };

    const timer = window.setInterval(check, NOTIFICATION_POLL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  // A page that just rendered is already fresh, so its count is the baseline.
  useEffect(() => {
    setOpen(false);
    void refreshNotifications().then((next) => {
      if (next) lastCount.current = next.unreadCount;
    });
  }, [pathname]);

  // Reading items locally lowers the count; don't treat the next rise back to
  // the same number as news.
  useEffect(() => {
    lastCount.current = Math.min(lastCount.current, summary.unreadCount);
  }, [summary.unreadCount]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unread = summary.unreadCount;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900",
          open && "bg-ink-100 text-ink-900"
        )}
      >
        <Bell className="h-4 w-4" aria-hidden />
        <CountBadge
          count={unread}
          className="absolute -right-0.5 -top-0.5 ring-2 ring-surface"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[22rem] animate-fade-in max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-fib5 py-fib4">
            <p className="text-sm font-semibold text-ink-900">
              Notifications
              {unread > 0 && (
                <span className="ml-fib3 font-normal text-ink-400">{unread} new</span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markNotificationsRead([{ all: true }])}
                className="flex items-center gap-fib2 text-xs font-semibold text-brand-700 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {summary.recent.length === 0 ? (
            <div className="px-fib6 py-fib7 text-center">
              <Bell className="mx-auto h-6 w-6 text-ink-300" />
              <p className="mt-fib3 text-sm font-medium text-ink-700">
                You&apos;re all caught up
              </p>
              <p className="mt-fib1 text-xs text-ink-400">
                New applicants, messages and decisions show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {summary.recent.map((item) => {
                const body = (
                  <>
                    <NotificationIcon type={item.type} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm",
                          item.read ? "text-ink-600" : "font-semibold text-ink-900"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500 line-clamp-2">
                        {item.message}
                      </span>
                      <span className="mt-fib1 block text-[11px] text-ink-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                    {!item.read && (
                      <span
                        aria-label="Unread"
                        className="mt-fib2 h-2 w-2 shrink-0 rounded-full bg-brand-600"
                      />
                    )}
                  </>
                );
                const rowClass = cn(
                  "flex gap-fib4 px-fib5 py-fib4 transition-colors hover:bg-ink-50",
                  !item.read && "bg-brand-50/60"
                );
                const markRead = () => {
                  if (!item.read)
                    void markNotificationsRead([{ notificationId: item.id }]);
                };

                return (
                  <li key={item.id}>
                    {item.linkUrl ? (
                      <Link href={item.linkUrl} onClick={markRead} className={rowClass}>
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={markRead}
                        className={cn(rowClass, "w-full text-left")}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
