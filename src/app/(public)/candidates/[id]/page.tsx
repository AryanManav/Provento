import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCandidatePublicProfile, getProfileSocial } from "@/lib/data/directory";
import { CandidateProfile, PrivateProfile } from "@/components/profile/candidate-profile";

export const dynamic = "force-dynamic";

/** A candidate's public profile, or the private notice when they're hidden. */
export default async function CandidatePublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/candidates/${id}`);

  const [candidate, social] = await Promise.all([
    getCandidatePublicProfile(id),
    getProfileSocial({ candidateId: id }),
  ]);
  if (!candidate) notFound();

  return (
    <div className="bg-ink-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {candidate === "private" ? (
          <PrivateProfile />
        ) : (
          <CandidateProfile candidate={candidate} social={social} />
        )}
      </div>
    </div>
  );
}
