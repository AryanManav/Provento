import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  getCandidatePublicProfile,
  getProfileConnections,
  getProfileSocial,
} from "@/lib/data/directory";
import { ConnectionList } from "@/components/profile/connection-list";
import { PrivateProfile } from "@/components/profile/candidate-profile";

export const dynamic = "force-dynamic";

export default async function CandidateConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q = "" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/candidates/${id}/followers`);

  const [candidate, social, connections] = await Promise.all([
    getCandidatePublicProfile(id),
    getProfileSocial({ candidateId: id }),
    getProfileConnections("followers", { candidateId: id }),
  ]);
  if (!candidate) notFound();

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {candidate === "private" ? (
          <PrivateProfile />
        ) : (
          <ConnectionList
            owner={{
              name: candidate.fullName,
              role: "candidate",
              href: `/candidates/${id}`,
              followersHref: `/candidates/${id}/followers`,
              followingHref: `/candidates/${id}/following`,
            }}
            direction="followers"
            connections={connections}
            total={social.followers}
            query={q}
          />
        )}
      </div>
    </div>
  );
}
