"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  recordProjectFeedbackAction,
  recordProjectOutcomeAction,
  reviewSubmissionAction,
} from "@/lib/actions/evaluation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HIRE_RECOMMENDATIONS,
  QUALITY_LEVELS,
  RECORDABLE_OUTCOMES,
} from "@/lib/constants";
import type { ActionResponse } from "@/lib/types/actions";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function Feedback({ state }: { state: ActionResponse | null }) {
  if (state?.error) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        Saved.
      </p>
    );
  }
  return null;
}

export function ReviewSubmissionForm({ submissionId }: { submissionId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) =>
      reviewSubmissionAction(prev, formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <Feedback state={state} />
      <select
        name="decision"
        defaultValue="accepted"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="accepted">Accept</option>
        <option value="revision_requested">Request revision</option>
        <option value="rejected">Reject</option>
      </select>
      <Button size="sm" type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply decision"}
      </Button>
    </form>
  );
}

function QualitySelect({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 uppercase">{label}</label>
      <select
        name={name}
        defaultValue="meets_expectations"
        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm capitalize"
      >
        {QUALITY_LEVELS.map((level) => (
          <option key={level} value={level} className="capitalize">
            {humanize(level)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProjectFeedbackForm({
  projectId,
  evaluationCriteria,
}: {
  projectId: string;
  evaluationCriteria: string[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) =>
      recordProjectFeedbackAction(prev, formData),
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <Feedback state={state} />

      {evaluationCriteria.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            The criteria you set when posting this project
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-700 mt-1.5 space-y-0.5">
            {evaluationCriteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <QualitySelect name="technicalQuality" label="Technical quality" />
        <QualitySelect name="completeness" label="Completeness" />
        <QualitySelect name="testingQuality" label="Testing" />
        <QualitySelect name="documentationQuality" label="Documentation" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="requirementsCompleted" className="h-4 w-4" />
          All requirements completed
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="deadlineMet" defaultChecked className="h-4 w-4" />
          Delivered by the deadline
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Revisions required
        </label>
        <Input name="revisionsRequired" type="number" min="0" max="20" defaultValue="0" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Feedback for the candidate
        </label>
        <textarea
          name="writtenFeedback"
          rows={4}
          required
          placeholder="What did they do well, and what would you want to see done differently?"
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          What was missing (optional)
        </label>
        <textarea
          name="whatWasMissing"
          rows={2}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Based on this work, what would you do next?
        </label>
        <select
          name="wouldInterviewOrHire"
          defaultValue="interview"
          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm capitalize"
        >
          {HIRE_RECOMMENDATIONS.map((option) => (
            <option key={option} value={option} className="capitalize">
              {humanize(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="rounded-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save evaluation"}
        </Button>
      </div>
    </form>
  );
}

export function ProjectOutcomeForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) =>
      recordProjectOutcomeAction(prev, formData),
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <Feedback state={state} />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">Outcome</label>
        <select
          name="outcome"
          defaultValue="interview"
          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm capitalize"
        >
          {RECORDABLE_OUTCOMES.map((option) => (
            <option key={option} value={option} className="capitalize">
              {humanize(option)}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500">
          A no-hire is a valid, useful outcome — it still means the evaluation gave you
          real evidence.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Reason (optional)
        </label>
        <textarea
          name="reason"
          rows={2}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase">
          Internal notes (optional)
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Only your team sees this — useful for the pilot debrief."
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="rounded-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record outcome"}
        </Button>
      </div>
    </form>
  );
}
