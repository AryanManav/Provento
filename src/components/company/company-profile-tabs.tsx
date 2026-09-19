"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Basics", href: "/company/profile" },
  { label: "Culture and stack", href: "/company/profile/culture" },
  { label: "Links", href: "/company/profile/links" },
  { label: "Team", href: "/company/profile/team" },
] as const;

/** The parts of the company profile, each edited on its own tab. */
export function CompanyProfileTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Company profile sections"
      className="no-scrollbar -mx-1 overflow-x-auto border-b border-line px-1"
    >
      <ul className="flex gap-5">
        {TABS.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm transition-colors",
                  active
                    ? "border-brand-600 font-medium text-ink-900"
                    : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
