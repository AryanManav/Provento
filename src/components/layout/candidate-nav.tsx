"use client";

import { Briefcase, Clock, Hammer, Settings, User } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";
import type { NotificationSummary } from "@/lib/types/domain";

// Skills and portfolio are sections of the profile, and project browsing lives
// in the top navbar — listing them here too made the same page reachable from
// several tabs.
const ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: Briefcase },
  { label: "My Profile", href: "/candidate/profile", icon: User },
  { label: "My Applications", href: "/candidate/applications", icon: Clock, badge: true },
  {
    label: "Trial Projects",
    href: "/candidate/trials",
    icon: Hammer,
    match: "prefix",
    badge: true,
  },
  { label: "Settings", href: "/candidate/settings", icon: Settings },
];

/** Identity and sign-out live in the navbar user menu, not here. */
export function CandidateNav({ notifications }: { notifications: NotificationSummary }) {
  return (
    <SidebarNav
      items={ITEMS}
      eyebrow="Candidate Workspace"
      notifications={notifications}
    />
  );
}
