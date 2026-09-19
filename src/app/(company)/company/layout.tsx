import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { CompanyNav } from "@/components/layout/company-nav";
import { SiteShell, Workspace } from "@/components/layout/site-shell";
import { getNotificationSummary } from "@/lib/data/notifications";
import { getCompanyForUser } from "@/lib/data/company";
import { isCompanyReadyToPost } from "@/lib/company";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["company", "admin"]);
  // A startup sets up its company before its workspace opens.
  if (
    user.role === "company" &&
    !isCompanyReadyToPost(await getCompanyForUser(user.id))
  ) {
    redirect("/onboarding/company");
  }
  const notifications = await getNotificationSummary(user.id);

  return (
    <SiteShell>
      <Workspace nav={<CompanyNav notifications={notifications} />}>{children}</Workspace>
    </SiteShell>
  );
}
