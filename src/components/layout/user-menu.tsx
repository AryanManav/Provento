"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationFor } from "@/lib/constants";
import { Avatar } from "@/components/common/avatar";
import type { CurrentUser } from "@/lib/auth/guards";
import { RoleBadge } from "@/components/profile/role-badge";

const MENU_ICONS: Record<string, LucideIcon> = {
  "My profile": UserRound,
  "My work": Briefcase,
  "Company profile": Building2,
  Team: Users,
  Settings,
};

export function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Navigating away should close the menu — the dropdown outlives the click
  // otherwise, since Next keeps the layout mounted across route changes.
  useEffect(() => setOpen(false), [pathname]);

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

  const menu = navigationFor(user.role)?.menu ?? [];
  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 focus-visible:bg-ink-50";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.fullName}`}
        className="flex items-center gap-1.5 rounded-lg p-1 pr-1.5 transition-colors hover:bg-ink-100"
      >
        <Avatar
          name={user.fullName}
          src={user.avatarUrl}
          className="h-7 w-7 rounded-full text-2xs"
        />
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-fade-in overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-medium text-ink-900">{user.fullName}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
            {user.role === "admin" ? (
              <p className="mt-1 text-2xs font-medium uppercase tracking-wider text-ink-400">
                Admin
              </p>
            ) : (
              <RoleBadge role={user.role} size="sm" className="mt-1.5" />
            )}
          </div>

          {menu.map((item) => {
            const Icon = MENU_ICONS[item.label] ?? LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={itemClass}
              >
                <Icon className="h-4 w-4 text-ink-400" aria-hidden />
                {item.label}
              </Link>
            );
          })}

          <form
            action="/auth/signout"
            method="post"
            className="mt-1 border-t border-line pt-1"
          >
            <button
              type="submit"
              role="menuitem"
              className={cn(itemClass, "text-rose-600 hover:bg-rose-50")}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
