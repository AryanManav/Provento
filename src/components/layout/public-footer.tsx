import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { dashboardFor, primaryNavFor } from "@/lib/constants";

export async function PublicFooter() {
  const user = await getCurrentUser();
  const links = primaryNavFor(user?.role);

  return (
    <footer className="border-t border-line bg-ink-50 text-ink-600">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-ink-900 text-lg">Trialent</span>
            </div>
            <p className="text-sm text-ink-500 max-w-sm">
              Try junior technical talent through standardized, paid work before making a
              hiring decision. Evidence before hiring.
            </p>
            <p className="text-xs text-ink-400">
              © {new Date().getFullYear()} Trialent. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-brand-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-900 mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              {user ? (
                <>
                  <li>
                    <Link
                      href={dashboardFor(user.role)}
                      className="hover:text-brand-600 transition-colors"
                    >
                      My Dashboard
                    </Link>
                  </li>
                  <li>
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="hover:text-brand-600 transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-brand-600 transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup?role=candidate"
                      className="hover:text-brand-600 transition-colors"
                    >
                      Join as Candidate
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup?role=company"
                      className="hover:text-brand-600 transition-colors"
                    >
                      Hire for Startup
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
