import Link from "next/link";
import { Eye } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser } from "@/lib/data/company";
import { companyProfilePath } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { CompanyProfileTabs } from "@/components/company/company-profile-tabs";

/**
 * Editing the company's public page. The page itself lives at
 * /companies/[id]; this is where each part of it is written.
 */
export default async function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["company", "admin"]);
  const companyId = await getCompanyIdForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader
          title="Edit company profile"
          description="Candidates read your public page before applying to your projects. A complete page earns more, and better, applications."
          actions={
            companyId && (
              <Link href={companyProfilePath(companyId)}>
                <Button variant="outline">
                  <Eye className="h-4 w-4" aria-hidden />
                  View public page
                </Button>
              </Link>
            )
          }
        />
        <CompanyProfileTabs />
      </div>
      {children}
    </div>
  );
}
