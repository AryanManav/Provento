"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardFor, profileFor } from "@/lib/constants";
import { Avatar } from "@/components/common/avatar";
import type { CurrentUser } from "@/lib/auth/guards";

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

  const itemClass =
    "flex w-full items-center gap-fib4 px-fib5 py-fib4 text-sm text-ink-700 transition-colors hover:bg-ink-50";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-fib4 rounded-full border border-line py-fib2 pl-fib2 pr-fib5 transition-colors hover:bg-ink-50"
      >
        <Avatar
          name={user.fullName}
          src={user.avatarUrl}
          className="h-8 w-8 rounded-full text-xs"
        />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold text-ink-900">
            {user.fullName}
          </span>
          <span className="block text-xs capitalize text-ink-400">{user.role}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-fib4 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-lg"
        >
          <div className="border-b border-line px-fib5 py-fib5">
            <p className="truncate text-sm font-semibold text-ink-900">{user.fullName}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
          </div>

          <Link href={dashboardFor(user.role)} role="menuitem" className={itemClass}>
            <LayoutDashboard className="h-4 w-4 text-ink-400" />
            Dashboard
          </Link>

          {user.role !== "admin" && (
            <Link href={profileFor(user.role)} role="menuitem" className={itemClass}>
              <UserRound className="h-4 w-4 text-ink-400" />
              My profile
            </Link>
          )}

          <form action="/auth/signout" method="post" className="border-t border-line">
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
