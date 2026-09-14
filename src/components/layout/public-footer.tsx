import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                P
              </div>
              <span className="font-bold text-slate-900 text-lg">Provento</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Try junior technical talent through standardized, paid work before making a hiring decision. Evidence before hiring.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Provento Inc. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/projects" className="hover:text-indigo-600 transition-colors">Browse Projects</Link></li>
              <li><Link href="/how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</Link></li>
              <li><Link href="/for-candidates" className="hover:text-indigo-600 transition-colors">Candidate Guide</Link></li>
              <li><Link href="/for-companies" className="hover:text-indigo-600 transition-colors">Startup Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-indigo-600 transition-colors">Sign In</Link></li>
              <li><Link href="/signup?role=candidate" className="hover:text-indigo-600 transition-colors">Join as Candidate</Link></li>
              <li><Link href="/signup?role=company" className="hover:text-indigo-600 transition-colors">Hire for Startup</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
