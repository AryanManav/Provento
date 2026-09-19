import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanyIdForUser, getCompanyPublicProfile } from "@/lib/data/company";
import { getProfileSocial } from "@/lib/data/directory";
import { CompanyProfile } from "@/components/profile/company-profile";

export const dynamic = "force-dynamic";

/** A startup's public page, as anyone signed in sees it. */
export default async function CompanyPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  // Company details are readable by signed-in users only (RLS).
  if (!user) redirect(`/login?redirect=/companies/${id}`);

  const [company, social, viewerCompanyId] = await Promise.all([
    getCompanyPublicProfile(id),
    getProfileSocial({ companyId: id }),
    user.role === "company" ? getCompanyIdForUser(user.id) : Promise.resolve(null),
  ]);
  if (!company) notFound();

  return (
    <div className="bg-ink-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <CompanyProfile
          company={company}
          social={social}
          ownCompany={viewerCompanyId === company.id}
          viewerRole={user.role}
        />
      </div>
    </div>
  );
}
