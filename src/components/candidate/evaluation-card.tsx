import { Check, Minus, UserCheck, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatDate } from "@/lib/utils";
import type { CandidateEvaluationView } from "@/lib/types/domain";
import type { ProjectOutcomeType } from "@/lib/types/database.types";

const BANDS = ["below_expectations", "meets_expectations", "exceeds_expectations"];
const BAND_LABEL: Record<string, string> = {
  below_expectations: "Below expectations",
  meets_expectations: "Meets expectations",
  exceeds_expectations: "Exceeds expectations",
};

const OUTCOME: Record<ProjectOutcomeType, { label: string; strong: boolean }> = {
  hire: { label: "Hire", strong: true },
  interview: { label: "Would interview", strong: true },
  talent_pool: { label: "Added to talent pool", strong: false },
  no_hire: { label: "Not moving forward", strong: false },
  candidate_withdrew: { label: "Withdrew", strong: false },
  project_cancelled: { label: "Project cancelled", strong: false },
};

/** A quality band as three segments — a position, not a grade. */
function Band({ value }: { value: string }) {
  const index = BANDS.indexOf(value);
  return (
    <div className="flex items-center gap-3">
      <span className="flex gap-0.5" aria-hidden>
        {BANDS.map((band, position) => (
          <span
            key={band}
            className={cn(
              "h-1.5 w-5 rounded-full",
              position <= index
                ? index === 2
                  ? "bg-emerald-500"
                  : index === 1
                    ? "bg-brand-500"
                    : "bg-amber-500"
                : "bg-ink-200"
            )}
          />
        ))}
      </span>
      <span className="w-44 text-sm font-medium text-ink-900">
        {BAND_LABEL[value] ?? value.replaceAll("_", " ")}
      </span>
    </div>
  );
}

function Fact({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900">
      {ok ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden />
      ) : (
        <X className="h-4 w-4 text-rose-600" aria-hidden />
      )}
      {label}
    </span>
  );
}

/**
 * The startup's evaluation as professional evidence: quality in bands,
 * observable facts, their words, and the hiring signal.
 */
export function EvaluationCard({
  evaluation,
  companyName,
  accepted,
}: {
  evaluation: CandidateEvaluationView;
  companyName: string;
  accepted: boolean;
}) {
  const { feedback, outcome } = evaluation;
  if (!feedback) return null;
  const signal = outcome ? OUTCOME[outcome] : null;

  return (
    <section
      aria-labelledby="evaluation-title"
      className="overflow-hidden rounded-xl border border-line bg-white"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
            Project evaluation
          </p>
          <h2
            id="evaluation-title"
            className="mt-0.5 text-base font-semibold text-ink-900"
          >
            {companyName}&apos;s assessment
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">{formatDate(feedback.recordedAt)}</span>
          <StatusBadge
            tone={accepted ? "success" : "danger"}
            label={accepted ? "Accepted" : "Not accepted"}
          />
        </div>
      </header>

      <dl className="divide-y divide-line">
        {[
          ["Technical quality", feedback.technicalQuality],
          ["Completeness", feedback.completeness],
          ["Testing", feedback.testingQuality],
          ["Documentation", feedback.documentationQuality],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <dt className="text-sm text-ink-500">{label}</dt>
            <dd>
              <Band value={value} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line bg-ink-50 px-5 py-3">
        <Fact
          ok={feedback.requirementsCompleted}
          label={
            feedback.requirementsCompleted
              ? "All requirements completed"
              : "Requirements not fully completed"
          }
        />
        <Fact
          ok={feedback.deadlineMet}
          label={feedback.deadlineMet ? "Delivered on time" : "Delivered late"}
        />
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900">
          <Minus className="h-4 w-4 text-ink-400" aria-hidden />
          {feedback.revisionsRequired} revision
          {feedback.revisionsRequired === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-4 border-t border-line px-5 py-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
            Company feedback
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
            {feedback.writtenFeedback}
          </p>
        </div>
        {feedback.whatWasMissing && (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
              What was missing
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {feedback.whatWasMissing}
            </p>
          </div>
        )}
      </div>

      {signal && (
        <footer className="flex items-center justify-between border-t border-line px-5 py-3">
          <span className="text-sm text-ink-600">Hiring signal</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold",
              signal.strong ? "text-brand-700" : "text-ink-700"
            )}
          >
            <UserCheck className="h-4 w-4" aria-hidden />
            {signal.label}
          </span>
        </footer>
      )}
    </section>
  );
}
