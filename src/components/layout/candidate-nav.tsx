"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, User, Clock, Hammer, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { countUnreadUnder } from "@/lib/notifications";
import { useNotificationSummary } from "@/components/notifications/notification-store";
import { CountBadge } from "@/components/notifications/count-badge";
import type { NotificationSummary } from "@/lib/types/domain";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
}

// Skills and portfolio are sections of the profile, and project browsing lives
// in the top navbar — listing them here too made the same page reachable from
// several tabs.
const ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: Briefcase },
  { label: "My Profile", href: "/candidate/profile", icon: User },
  { label: "My Applications", href: "/candidate/applications", icon: Clock },
  { label: "Trial Projects", href: "/candidate/trials", icon: Hammer, match: "prefix" },
];

/** Identity and sign-out live in the navbar user menu, not here. */
export function CandidateNav({ notifications }: { notifications: NotificationSummary }) {
  const pathname = usePathname();
  const { unread } = useNotificationSummary(notifications);

  const isActive = (item: NavItem) =>
    item.match === "prefix"
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : pathname === item.href;

  return (
    <div className="sticky top-16 z-40 w-full border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-fib3 overflow-x-auto px-fib5 py-fib4 sm:px-fib6 lg:px-fib7">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-fib4 rounded-lg px-fib5 py-fib4 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              <CountBadge count={countUnreadUnder(unread, item.href)} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
