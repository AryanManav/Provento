import { requireRole } from "@/lib/auth/guards";
import { CompanyProjectsScreen } from "@/components/company/company-projects-screen";

export const dynamic = "force-dynamic";

/** Finished projects: evaluated (completed) or cancelled. */
export default async function CompanyCompletedProjectsPage() {
  const user = await requireRole(["company", "admin"]);
  return <CompanyProjectsScreen userId={user.id} tab="completed" />;
}
