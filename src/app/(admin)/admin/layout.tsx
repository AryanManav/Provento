import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/components/layout/admin-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <PublicNavbar />
      <div className="flex flex-1">
        <AdminNav user={user} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
