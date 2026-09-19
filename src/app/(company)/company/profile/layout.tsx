import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser } from "@/lib/data/company";
import { companyProfilePath } from "@/lib/constants";
import { CompanyProfileTabs } from "@/components/company/company-profile-tabs";

export default async function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["company", "admin"]);
  const companyId = await getCompanyIdForUser(user.id);

  return (
    <div className="space-y-fib6 pb-fib8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Company profile</h1>
        <p className="mt-fib2 text-sm text-ink-500">
          Candidates see this before applying to your paid projects. A complete profile
          earns more, and better, applications.
        </p>
      </div>
      <CompanyProfileTabs publicHref={companyId ? companyProfilePath(companyId) : null} />
      {children}
    </div>
  );
}
