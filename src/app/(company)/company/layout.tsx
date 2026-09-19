import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { SiteShell, Workspace } from "@/components/layout/site-shell";
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

  return (
    <SiteShell footer={false}>
      <Workspace>{children}</Workspace>
    </SiteShell>
  );
}
