"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { saveAssessmentAction } from "@/lib/actions/assessment";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { AssessmentSubmissionView } from "@/lib/types/domain";

const fieldClass =
  "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

/**
 * The candidate's working copy of an assessment: tick requirements as they're
 * done (progress is theirs to report), add links, save as often as they like,
 * then submit once — submitting is final.
 */
export function AssessmentForm({
  projectId,
  requirements,
  submission,
  canSubmit,
}: {
  projectId: string;
  requirements: string[];
  submission: AssessmentSubmissionView | null;
  /** False once the assessment deadline has passed: progress saves, submit doesn't. */
  canSubmit: boolean;
}) {
  const [state, action, pending] = useActionState(saveAssessmentAction, null);
  const [done, setDone] = useState<Set<number>>(
    new Set(submission?.completedRequirements ?? [])
  );
  const [confirming, setConfirming] = useState(false);
  const percent =
    requirements.length === 0 ? 0 : Math.round((done.size / requirements.length) * 100);

  const toggle = (index: number) =>
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />

      <section aria-labelledby="progress-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="progress-title" className="text-sm font-semibold text-ink-900">
            Progress
          </h2>
          <span className="tabular text-sm text-ink-700">
            <span className="font-semibold text-ink-900">{percent}%</span> · {done.size}{" "}
            of {requirements.length} requirements
          </span>
        </div>
        <ProgressBar value={percent} label="Assessment progress" />
        <ul className="divide-y divide-line rounded-md border border-line">
          {requirements.map((requirement, index) => (
            <li key={`${index}-${requirement}`}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm hover:bg-ink-50">
                <input
                  type="checkbox"
                  name="completed"
                  value={index}
                  checked={done.has(index)}
                  onChange={() => toggle(index)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-brand-600"
                />
                <span
                  className={
                    done.has(index) ? "text-ink-500 line-through" : "text-ink-800"
                  }
                >
                  {requirement}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-500">
          Ticks are your own progress notes — the company sees them alongside your work.
        </p>
      </section>

      <section aria-labelledby="submission-title" className="space-y-4">
        <h2 id="submission-title" className="text-sm font-semibold text-ink-900">
          Submission
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Repository URL
            <input
              name="repositoryUrl"
              type="url"
              inputMode="url"
              defaultValue={submission?.repositoryUrl ?? ""}
              placeholder="https://github.com/you/dashboard"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-ink-800">
            Deployed or live URL
            <input
              name="liveUrl"
              type="url"
              inputMode="url"
              defaultValue={submission?.liveUrl ?? ""}
              placeholder="https://dashboard.vercel.app"
              className={fieldClass}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink-800">
          Notes for the reviewer{" "}
          <span className="font-normal text-ink-400">optional</span>
          <textarea
            name="notes"
            rows={5}
            maxLength={5000}
            defaultValue={submission?.notes ?? ""}
            placeholder="How you approached it, trade-offs you made, anything unfinished."
            className={fieldClass}
          />
        </label>
      </section>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {state.error}
        </p>
      )}
      {state?.success && !confirming && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Progress saved.
        </p>
      )}

      {confirming ? (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
            <Lock className="h-4 w-4" aria-hidden />
            Submit your assessment? You can&apos;t change it afterwards.
          </p>
          <p className="text-sm text-amber-800">
            The company reviews what you submit here. Add at least a repository or a live
            link.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="intent" value="submit" loading={pending}>
              Confirm and submit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Keep working
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            name="intent"
            value="save"
            variant="outline"
            loading={pending}
          >
            Save progress
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || pending}
            title={canSubmit ? undefined : "The assessment deadline has passed"}
            onClick={() => setConfirming(true)}
          >
            Submit assessment
          </Button>
        </div>
      )}
    </form>
  );
}
