import { Award, Building, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/common/section-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VerifiedTrialView } from "@/lib/types/domain";

const OUTCOME_LABEL: Partial<Record<NonNullable<VerifiedTrialView["outcome"]>, string>> =
  {
    hire: "Hired",
    interview: "Interview offered",
    talent_pool: "Added to talent pool",
  };

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

export function VerifiedHistoryCard({
  trials,
  readOnly = false,
}: {
  trials: VerifiedTrialView[];
  readOnly?: boolean;
}) {
  return (
    <SectionCard title="Verified work history" icon={ShieldCheck} count={trials.length}>
      {trials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-50 px-fib6 py-fib7 text-center">
          <Award className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-fib4 text-sm font-semibold text-ink-700">
            No verified projects yet
          </p>
          <p className="mx-auto mt-fib2 max-w-sm text-xs text-ink-400">
            {readOnly
              ? "This candidate hasn't completed a paid project on Provento yet."
              : "Complete a paid project for a startup and their evaluation appears here — evidence written by the people who reviewed your work."}
          </p>
        </div>
      ) : (
        <div className="space-y-fib5">
          {trials.map((trial) => {
            const outcome = trial.outcome ? OUTCOME_LABEL[trial.outcome] : undefined;
            return (
              <article
                key={trial.id}
                className="space-y-fib5 rounded-xl border border-line p-fib6"
              >
                <div className="flex flex-col justify-between gap-fib4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink-900">{trial.projectTitle}</h3>
                    <p className="mt-fib2 flex flex-wrap items-center gap-x-fib5 gap-y-fib2 text-xs text-ink-400">
                      <span className="flex items-center gap-fib2 font-medium text-ink-600">
                        <Building className="h-3.5 w-3.5" />
                        {trial.companyName}
                      </span>
                      <span className="flex items-center gap-fib2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(trial.completedAt)}
                      </span>
                      <span>
                        {formatCurrency(trial.paymentAmount, trial.currency)} project
                      </span>
                    </p>
                  </div>
                  {outcome && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-fib5 py-fib2 text-xs font-semibold text-emerald-700">
                      {outcome}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-fib4 text-xs">
                  <span className="inline-flex items-center gap-fib2 rounded-full bg-ink-100 px-fib5 py-fib2 font-medium text-ink-700">
                    <CheckCircle2
                      className={
                        trial.requirementsCompleted
                          ? "h-3.5 w-3.5 text-emerald-600"
                          : "h-3.5 w-3.5 text-ink-400"
                      }
                    />
                    {trial.requirementsCompleted
                      ? "All requirements met"
                      : "Some requirements open"}
                  </span>
                  <span className="rounded-full bg-ink-100 px-fib5 py-fib2 font-medium capitalize text-ink-700">
                    Technical: {humanize(trial.technicalQuality)}
                  </span>
                </div>

                {trial.writtenFeedback && (
                  <blockquote className="rounded-lg border-l-4 border-brand-200 bg-ink-50 px-fib5 py-fib4 text-sm leading-relaxed text-ink-700">
                    &ldquo;{trial.writtenFeedback}&rdquo;
                  </blockquote>
                )}
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
