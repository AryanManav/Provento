import { requireRole } from "@/lib/auth/guards";
import { CompanyNav } from "@/components/layout/company-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["company", "admin"]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="flex flex-1">
        <CompanyNav user={user} />
        <main className="flex-1 p-6 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
