import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { dashboardFor } from "@/lib/constants";
import { Logo } from "@/components/layout/logo";
import type { UserRole } from "@/lib/types/database.types";

interface FooterLink {
  label: string;
  href: string;
}

/**
 * Each column's links go somewhere real for whoever is reading: a candidate's
 * "My work" is their own, a visitor's is the sign-up. Pages that don't exist
 * yet (legal, about, careers) aren't linked until they do.
 */
function columnsFor(role: UserRole | null): { title: string; links: FooterLink[] }[] {
  const candidate = role === "candidate";
  const company = role === "company";
  return [
    {
      title: "Candidates",
      links: [
        { label: "Browse projects", href: "/projects" },
        candidate
          ? { label: "My work", href: "/candidate/applications" }
          : { label: "How it works for candidates", href: "/for-candidates" },
        candidate
          ? { label: "My profile", href: "/candidate/profile" }
          : { label: "Join as a candidate", href: "/signup?role=candidate" },
      ],
    },
    {
      title: "Startups",
      links: [
        {
          label: "Post a project",
          href: company ? "/company/projects/create" : "/signup?role=company",
        },
        company
          ? { label: "Candidates", href: "/company/candidates" }
          : { label: "How it works for startups", href: "/for-companies" },
        role
          ? { label: "Discover talent", href: "/search?type=candidates" }
          : { label: "Join as a startup", href: "/signup?role=company" },
      ],
    },
    {
      title: "Product",
      links: [
        { label: "How it works", href: "/how-it-works" },
        { label: "Projects", href: "/projects" },
        { label: "Companies", href: "/companies" },
      ],
    },
  ];
}

const linkClass = "text-ink-500 transition-colors hover:text-ink-900";

export async function PublicFooter() {
  const user = await getCurrentUser();
  const columns = columnsFor(user?.role ?? null);

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-ink-500">
            Try talent through real work before you hire.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-xs font-semibold text-ink-900">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label="Account">
          <h2 className="text-xs font-semibold text-ink-900">Account</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {user ? (
              <>
                <li>
                  <Link href={dashboardFor(user.role)} className={linkClass}>
                    Home
                  </Link>
                </li>
                <li>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className={linkClass}>
                      Sign out
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/login" className={linkClass}>
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className={linkClass}>
                    Create an account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-400 sm:px-6">
          © {new Date().getFullYear()} Trialent
        </p>
      </div>
    </footer>
  );
}
