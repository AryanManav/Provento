import { requireRole } from "@/lib/auth/guards";
import { CompanyProjectsScreen } from "@/components/company/company-projects-screen";

export const dynamic = "force-dynamic";

/** Live projects: released, taking applications, or being built. */
export default async function CompanyActiveProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; deleted?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { created, deleted, error } = await searchParams;
  return (
    <CompanyProjectsScreen
      userId={user.id}
      tab="active"
      created={created}
      deleted={deleted}
      error={error}
    />
  );
}
