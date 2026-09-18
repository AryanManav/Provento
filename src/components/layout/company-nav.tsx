"use client";

import { Building2, LayoutDashboard, Settings, Users } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";
import type { NotificationSummary } from "@/lib/types/domain";

const ITEMS: SidebarNavItem[] = [
  { label: "Overview", href: "/company/dashboard", icon: LayoutDashboard },
  {
    label: "Evaluation Projects",
    href: "/company/projects",
    icon: Building2,
    match: "prefix",
    badge: true,
  },
  { label: "Company Profile", href: "/company/profile", icon: Users },
  { label: "Settings", href: "/company/settings", icon: Settings },
];

export function CompanyNav({ notifications }: { notifications: NotificationSummary }) {
  return (
    <SidebarNav items={ITEMS} eyebrow="Startup Workspace" notifications={notifications} />
  );
}
