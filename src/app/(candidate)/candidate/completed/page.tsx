import { CheckCircle2 } from "lucide-react";
import { requireCandidate } from "@/lib/auth/guards";
import { getCandidateProfileId } from "@/lib/data/candidate";
import { getCandidateTrials } from "@/lib/data/trial";
import { isClosedWork } from "@/lib/applications";
import { EmptyState } from "@/components/common/empty-state";
import { MyWorkHeader } from "@/components/candidate/my-work-header";
import { StatCard } from "@/components/common/stat-card";
import { TrialList } from "@/components/candidate/trial-list";
import { formatCurrency } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Finished projects and how each one was evaluated. */
export default async function CandidateCompletedPage() {
  const user = await requireCandidate();
  const candidateId = await getCandidateProfileId(user.id);
  const trials = candidateId
    ? (await getCandidateTrials(candidateId)).filter(isClosedWork)
    : [];
  const accepted = trials.filter((trial) => trial.workStatus === "completed");
  const earned = accepted.reduce((total, trial) => total + trial.paymentAmount, 0);

  return (
    <div className="space-y-6">
      <MyWorkHeader section="completed" counts={{ completed: trials.length }} />

      {trials.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Finished"
            value={trials.length}
            hint="Evaluated by a startup"
          />
          <StatCard
            label="Accepted"
            value={accepted.length}
            hint="On your verified history"
          />
          <StatCard
            label="Earned"
            value={formatCurrency(earned, DEFAULT_CURRENCY)}
            hint="Agreed fees of accepted work"
            tone="positive"
          />
        </div>
      )}

      {trials.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No completed projects yet"
          description="When a startup evaluates work you've delivered, the result and their feedback appear here."
          actionText="View active work"
          actionHref="/candidate/trials"
        />
      ) : (
        <TrialList trials={trials} />
      )}
    </div>
  );
}
