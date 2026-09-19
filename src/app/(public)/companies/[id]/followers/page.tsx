import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanyPublicProfile } from "@/lib/data/company";
import { getProfileConnections, getProfileSocial } from "@/lib/data/directory";
import { companyProfilePath } from "@/lib/constants";
import { ConnectionList } from "@/components/profile/connection-list";

export const dynamic = "force-dynamic";

export default async function CompanyFollowersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/companies/${id}/followers`);

  const [company, social, connections] = await Promise.all([
    getCompanyPublicProfile(id),
    getProfileSocial({ companyId: id }),
    getProfileConnections("followers", { companyId: id }),
  ]);
  if (!company) notFound();

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ConnectionList
          owner={{
            name: company.name,
            role: "company",
            href: companyProfilePath(id),
            followersHref: `/companies/${id}/followers`,
          }}
          direction="followers"
          connections={connections}
          total={social.followers}
          query={q}
        />
      </div>
    </div>
  );
}
