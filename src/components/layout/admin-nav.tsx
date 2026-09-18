"use client";

import { ShieldCheck, Users, Building } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";

const ITEMS: SidebarNavItem[] = [
  { label: "Platform Overview", href: "/admin", icon: ShieldCheck },
  { label: "Users & Moderation", href: "/admin/users", icon: Users },
  { label: "Company Verification", href: "/admin/companies", icon: Building },
];

export function AdminNav() {
  return <SidebarNav items={ITEMS} eyebrow="System Admin" />;
}
