"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/lib/constants";

/**
 * The role's top-level links, with the current section highlighted. The most
 * specific match wins, so "Post a project" (/company/projects/create) lights up
 * instead of "Projects" (/company/projects) on the create page.
 */
export function PrimaryNavLinks({
  links,
  variant,
}: {
  links: NavLink[];
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const matches = links.filter(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  );
  const active = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      aria-label="Main"
      className={cn(
        variant === "desktop"
          ? "hidden items-center gap-fib2 lg:flex"
          : "flex gap-fib2 overflow-x-auto border-t border-line px-fib5 py-fib3 lg:hidden"
      )}
    >
      {links.map((link) => {
        const current = link.href === active;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-lg px-fib4 py-fib3 text-sm font-medium transition-colors",
              current
                ? "bg-brand-50 text-brand-700"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
