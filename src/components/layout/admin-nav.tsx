import Link from "next/link";
import { CurrentUser } from "@/lib/auth/guards";
import { ShieldCheck, Users, Building, FileCode2, CreditCard, AlertCircle, LogOut } from "lucide-react";

export function AdminNav({ user }: { user: CurrentUser }) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-100 flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div className="px-3 py-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>System Admin</span>
          </div>
          <div className="font-medium text-white truncate mt-1">{user.fullName}</div>
          <div className="text-xs text-slate-400 truncate">{user.email}</div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Platform Overview</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Users & Moderation</span>
          </Link>
          <Link
            href="/admin/companies"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Building className="h-4 w-4" />
            <span>Company Verification</span>
          </Link>
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
