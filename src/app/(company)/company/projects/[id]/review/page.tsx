import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser, getProjectHeader } from "@/lib/data/company";
import { getSelectedCandidates } from "@/lib/data/evaluation";

export const dynamic = "force-dynamic";

/**
 * Evaluation lives per selected candidate at /review/[candidateId]. This older
 * address (bookmarks, old notifications) goes to the first selected candidate,
 * or back to the applicants if nobody is selected yet.
 */
export default async function ProjectReviewRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { id } = await params;

  const project = await getProjectHeader(id);
  if (!project) notFound();
  if (user.role !== "admin") {
    const companyId = await getCompanyIdForUser(user.id);
    if (companyId !== project.companyId) notFound();
  }

  const [first] = await getSelectedCandidates(id);
  redirect(
    first
      ? `/company/projects/${id}/review/${first.candidateId}`
      : `/company/projects/${id}`
  );
}
