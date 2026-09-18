import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/components/layout/admin-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <PublicNavbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminNav />
        <main className="w-full flex-1 min-h-[32rem] mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
