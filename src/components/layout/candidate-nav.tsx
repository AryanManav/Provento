"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurrentUser } from "@/lib/auth/guards";
import {
  Briefcase,
  User,
  FileText,
  Clock,
  LogOut,
  Compass,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CandidateNav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/candidate/dashboard",
      icon: Briefcase,
      active: pathname === "/candidate/dashboard",
    },
    {
      label: "My Profile",
      href: "/candidate/profile",
      icon: User,
      active: pathname === "/candidate/profile",
    },
    {
      label: "Browse Projects",
      href: "/projects",
      icon: Compass,
      active: pathname === "/projects",
    },
    {
      label: "My Applications",
      href: "/candidate/applications",
      icon: Clock,
      active: pathname === "/candidate/applications",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="w-full bg-white border-b border-[#e0dfdc] sticky top-16 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                  item.active
                    ? "text-[#0a66c2] bg-[#ebf4fd] border-b-2 border-[#0a66c2]"
                    : "text-slate-600 hover:text-[#191919] hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Pill & Signout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div className="h-7 w-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
              {getInitials(user.fullName)}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400">Candidate</span>
            </div>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
