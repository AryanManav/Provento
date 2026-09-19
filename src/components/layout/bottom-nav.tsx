"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  FolderKanban,
  Home,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive, type NavLink } from "@/lib/constants";
import { useNotificationSummary } from "@/components/notifications/notification-store";
import { unreadIn } from "@/components/layout/primary-nav-links";
import type { NotificationSummary } from "@/lib/types/domain";

const ICONS: Record<string, LucideIcon> = {
  Home,
  Overview: ShieldCheck,
  Projects: FolderKanban,
  "My work": Briefcase,
  Candidates: Users,
  Users,
  Companies: Building2,
  Company: Building2,
  Profile: UserRound,
};

const SEARCH: NavLink = { label: "Search", href: "/search" };

/**
 * The signed-in phone navigation: the role's key sections plus Search, fixed
 * to the bottom where thumbs are. Hidden from md up, where the navbar has room.
 */
export function BottomNav({
  items,
  notifications,
}: {
  items: NavLink[];
  notifications: NotificationSummary;
}) {
  const pathname = usePathname();
  const summary = useNotificationSummary(notifications);
  // Search sits in the middle, the conventional spot for the main verb.
  const middle = Math.floor(items.length / 2);
  const links = [...items.slice(0, middle), SEARCH, ...items.slice(middle)].slice(0, 5);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
    >
      {links.map((link) => {
        const Icon = link === SEARCH ? Search : (ICONS[link.label] ?? Home);
        const active = isNavActive(link, pathname);
        const unread = unreadIn(link, summary);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 text-2xs font-medium",
              active ? "text-brand-700" : "text-ink-500"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {link.label}
            {unread > 0 && (
              <span className="absolute left-1/2 top-2 ml-2 h-1.5 w-1.5 rounded-full bg-accent-500">
                <span className="sr-only">, {unread} new</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
