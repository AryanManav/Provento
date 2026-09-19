import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyForUser } from "@/lib/data/company";
import { isCompanyReadyToPost } from "@/lib/company";
import { CompanySetupForm } from "@/components/company/company-setup-form";

export const dynamic = "force-dynamic";

/**
 * A new startup sets up its company before anything else: candidates need to
 * know who they'd be working for, and the database won't accept a project
 * until these basics exist (company_ready_to_post).
 */
export default async function CompanySetupPage() {
  const user = await requireRole(["company"]);
  const company = await getCompanyForUser(user.id);
  if (isCompanyReadyToPost(company)) redirect("/company/dashboard");

  return <CompanySetupForm company={company} />;
}
