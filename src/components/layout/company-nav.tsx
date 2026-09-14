import Link from "next/link";
import { CurrentUser } from "@/lib/auth/guards";
import { Building2, PlusCircle, Users, LayoutDashboard, LogOut } from "lucide-react";

export function CompanyNav({ user }: { user: CurrentUser }) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div className="px-3 py-2 border-b border-slate-100 pb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Startup Workspace</div>
          <div className="font-medium text-slate-900 truncate mt-1">{user.fullName}</div>
          <div className="text-xs text-slate-500 truncate">{user.email}</div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/company/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </Link>
          <Link
            href="/company/projects"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            <span>Evaluation Projects</span>
          </Link>
          <Link
            href="/company/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Company Profile</span>
          </Link>
        </nav>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
