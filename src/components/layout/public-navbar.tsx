import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeFor, navbarActionFor, primaryNavFor } from "@/lib/constants";
import { Plus, Search } from "lucide-react";
import { PrimaryNavLinks } from "@/components/layout/primary-nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getNotificationSummary } from "@/lib/data/notifications";

export async function PublicNavbar() {
  const user = await getCurrentUser();
  const links = primaryNavFor(user?.role);
  const action = navbarActionFor(user?.role);
  // Admins aren't party to any application, so nothing is ever addressed to them.
  const notifications =
    user && user.role !== "admin" ? await getNotificationSummary(user.id) : null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href={homeFor(user?.role)} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                T
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  Trialent
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Talent Evaluation
                </span>
              </div>
            </Link>
            {links.length > 0 && <PrimaryNavLinks links={links} variant="desktop" />}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {action && (
                  <Link href={action.href} className="hidden sm:block">
                    <Button size="sm" className="gap-fib2">
                      <Plus className="h-4 w-4" />
                      {action.label}
                    </Button>
                  </Link>
                )}
                <Link
                  href="/search"
                  aria-label="Search companies and candidates"
                  title="Search companies and candidates"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <Search className="h-5 w-5" />
                </Link>
                {notifications && <NotificationBell initial={notifications} />}
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {/* Below the sticky header on small screens, so the header's height (and
        the sticky sidebar's offset) stays 4rem everywhere. */}
      {links.length > 0 && <PrimaryNavLinks links={links} variant="mobile" />}
    </>
  );
}
