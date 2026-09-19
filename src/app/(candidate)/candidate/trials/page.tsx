import Link from "next/link";
import { Hammer } from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { getCandidateTrials } from "@/lib/data/trial";
import { getNotificationSummary } from "@/lib/data/notifications";
import { unreadByProject } from "@/lib/notifications";
import { isClosedWork } from "@/lib/applications";
import { EmptyState } from "@/components/common/empty-state";
import { MyWorkHeader } from "@/components/candidate/my-work-header";
import { TrialList } from "@/components/candidate/trial-list";

export const dynamic = "force-dynamic";

/** Paid projects the candidate was selected for and is still working on. */
export default async function CandidateTrialsPage() {
  const user = await requireCandidate();
  const candidateId = await getCandidateProfileId(user.id);
  const [allTrials, notifications] = await Promise.all([
    candidateId ? getCandidateTrials(candidateId) : Promise.resolve([]),
    getNotificationSummary(user.id),
  ]);
  const trials = allTrials.filter((trial) => !isClosedWork(trial));
  const finishedCount = allTrials.length - trials.length;

  return (
    <div className="space-y-6">
      <MyWorkHeader section="active" counts={{ active: trials.length }} />

      {trials.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No active work"
          description="When a startup selects you for a project, it appears here with its brief, deadline and submission form."
          actionText="Browse projects"
          actionHref="/projects"
        />
      ) : (
        <TrialList trials={trials} updates={unreadByProject(notifications.unread)} />
      )}

      {finishedCount > 0 && (
        <p className="text-sm text-ink-500">
          {finishedCount} finished project{finishedCount === 1 ? "" : "s"} ·{" "}
          <Link
            href="/candidate/completed"
            className="font-medium text-brand-700 hover:underline"
          >
            See how they were evaluated
          </Link>
        </p>
      )}
    </div>
  );
}
