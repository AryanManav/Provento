"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Info, Link2, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/company/profile", icon: Info },
  { label: "Culture and stack", href: "/company/profile/culture", icon: Sparkles },
  { label: "Links", href: "/company/profile/links", icon: Link2 },
  { label: "Team", href: "/company/profile/team", icon: Users },
] as const;

/** Sections of the company profile, plus a jump to the public page candidates see. */
export function CompanyProfileTabs({ publicHref }: { publicHref: string | null }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Company profile sections"
      className="flex gap-fib2 overflow-x-auto border-b border-line"
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-fib2 border-b-2 px-fib5 py-fib4 text-sm font-semibold transition-colors",
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      {publicHref && (
        <Link
          href={publicHref}
          className="-mb-px ml-auto inline-flex shrink-0 items-center gap-fib2 border-b-2 border-transparent px-fib5 py-fib4 text-sm font-semibold text-ink-500 hover:text-brand-700"
        >
          <ExternalLink className="h-4 w-4" />
          Public page
        </Link>
      )}
    </nav>
  );
}
