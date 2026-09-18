import { requireRole } from "@/lib/auth/guards";
import { CompanyNav } from "@/components/layout/company-nav";
import { SiteShell, Workspace } from "@/components/layout/site-shell";
import { getNotificationSummary } from "@/lib/data/notifications";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["company", "admin"]);
  const notifications = await getNotificationSummary(user.id);

  return (
    <SiteShell>
      <Workspace nav={<CompanyNav notifications={notifications} />}>{children}</Workspace>
    </SiteShell>
  );
}
