import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guards";
import { Briefcase, ArrowRight } from "lucide-react";

export async function PublicNavbar() {
  const user = await getCurrentUser();

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "company") return "/company/dashboard";
    return "/candidate/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Provento</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Talent Evaluation</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/projects" className="hover:text-indigo-600 transition-colors">
              Browse Projects
            </Link>
            <Link href="/how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </Link>
            <Link href="/for-candidates" className="hover:text-indigo-600 transition-colors">
              For Candidates
            </Link>
            <Link href="/for-companies" className="hover:text-indigo-600 transition-colors">
              For Startups
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href={getDashboardLink()}>
              <Button size="sm" className="gap-2">
                <span>Dashboard ({user.role})</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
  );
}
