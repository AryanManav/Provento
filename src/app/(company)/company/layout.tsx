import { requireRole } from "@/lib/auth/guards";
import { CompanyNav } from "@/components/layout/company-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { getNotificationSummary } from "@/lib/data/notifications";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["company", "admin"]);
  const notifications = await getNotificationSummary(user.id);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <CompanyNav notifications={notifications} />
        <main className="w-full flex-1 min-h-[32rem] mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
