"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { countUnreadUnder } from "@/lib/notifications";
import { useNotificationSummary } from "@/components/notifications/notification-store";
import { CountBadge } from "@/components/notifications/count-badge";
import type { NotificationSummary } from "@/lib/types/domain";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** "prefix" keeps the parent highlighted on nested routes such as /projects/[id]. */
  match?: "exact" | "prefix";
  /** Badge this item with unread notifications that link under its href. */
  badge?: boolean;
}

const NO_NOTIFICATIONS: NotificationSummary = { unreadCount: 0, recent: [], unread: [] };

const TONES = {
  light: {
    shell: "bg-white border-line",
    eyebrow: "text-ink-400",
    divider: "border-line",
    item: "text-ink-700 hover:bg-ink-50 hover:text-brand-600",
    itemActive: "bg-brand-50 text-brand-700",
  },
  dark: {
    shell: "bg-ink-900 border-ink-800 text-ink-100",
    eyebrow: "text-brand-400",
    divider: "border-ink-800",
    item: "text-ink-300 hover:bg-ink-800 hover:text-white",
    itemActive: "bg-ink-800 text-white",
  },
} as const;

/**
 * A sidebar on md and up, a horizontally scrollable bar below it. Identity and
 * sign-out live in the navbar's user menu, so this stays purely navigational.
 */
export function SidebarNav({
  items,
  eyebrow,
  tone = "light",
  notifications = NO_NOTIFICATIONS,
}: {
  items: SidebarNavItem[];
  eyebrow: string;
  tone?: keyof typeof TONES;
  notifications?: NotificationSummary;
}) {
  const pathname = usePathname();
  const { unread } = useNotificationSummary(notifications);
  const styles = TONES[tone];

  const isActive = (item: SidebarNavItem) =>
    item.match === "prefix"
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : pathname === item.href;

  return (
    <aside
      className={cn(
        "shrink-0 border-b md:w-64 md:min-h-[calc(100vh-4rem)] md:border-b-0 md:border-r md:p-fib5",
        styles.shell
      )}
    >
      <p
        className={cn(
          "hidden px-fib5 pb-fib5 text-xs font-semibold uppercase tracking-wider md:block",
          styles.eyebrow
        )}
      >
        {eyebrow}
      </p>

      <nav className="flex gap-fib3 overflow-x-auto px-fib4 py-fib4 md:flex-col md:overflow-visible md:p-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-fib4 rounded-lg px-fib5 py-fib4 text-sm font-medium transition-colors",
                isActive(item) ? styles.itemActive : styles.item
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <CountBadge
                  count={countUnreadUnder(unread, item.href)}
                  className="ml-auto"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
