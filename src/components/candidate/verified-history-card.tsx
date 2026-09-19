import { VerifiedWorkList } from "@/components/profile/verified-work-list";
import type { VerifiedTrialView } from "@/lib/types/domain";

const OUTCOME_LABEL: Partial<Record<NonNullable<VerifiedTrialView["outcome"]>, string>> =
  {
    hire: "Hired",
    interview: "Interview offered",
    talent_pool: "Added to talent pool",
  };

/**
 * The owner's view of their verified work: the same list others see, plus
 * the private details — the startup's words and what happened next.
 */
export function VerifiedHistoryCard({
  trials,
  readOnly = false,
}: {
  trials: VerifiedTrialView[];
  readOnly?: boolean;
}) {
  return (
    <VerifiedWorkList
      emptyText={
        readOnly
          ? "This candidate hasn't completed a paid project on Trialent yet."
          : "When a startup accepts work you delivered, it appears here with who verified it — the evidence startups trust most."
      }
      items={trials.map((trial) => ({
        key: trial.id,
        title: trial.projectTitle,
        companyName: trial.companyName,
        date: trial.completedAt,
        facts: [
          trial.feedback &&
            (trial.feedback.requirementsCompleted
              ? "All requirements met"
              : "Some requirements open"),
          trial.outcome && OUTCOME_LABEL[trial.outcome],
        ].filter((fact): fact is string => Boolean(fact)),
        quote: trial.feedback?.writtenFeedback || trial.acceptanceNote,
      }))}
    />
  );
}
