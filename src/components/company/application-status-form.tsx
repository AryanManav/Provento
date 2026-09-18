"use client";

import { useState } from "react";
import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { updateApplicationStatusAction } from "@/lib/actions/company";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  REVIEWABLE_APPLICATION_STATUSES,
  REVIEWABLE_STATUS_LABELS,
} from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types/database.types";

type Reviewable = (typeof REVIEWABLE_APPLICATION_STATUSES)[number];

/** Choices that can't be undone — the database refuses any later change. */
const FINAL: Reviewable[] = ["selected", "rejected"];

/**
 * The company's decision on one application. "Reviewing" can be set freely;
 * Selected and Rejected are final, so they ask for confirmation and the control
 * disappears afterwards.
 */
export function ApplicationStatusForm({
  applicationId,
  status,
  selectionTaken = false,
  returnTo,
}: {
  applicationId: string;
  status: ApplicationStatus;
  /** Another candidate is already selected for this project. */
  selectionTaken?: boolean;
  /** Where to land afterwards; the action only honours this project's applicant pages. */
  returnTo?: string;
}) {
  const options = REVIEWABLE_APPLICATION_STATUSES.filter(
    (option) => !(option === "selected" && selectionTaken)
  );
  const [choice, setChoice] = useState<Reviewable>("reviewing");
  const [confirming, setConfirming] = useState(false);

  if (status === "withdrawn") {
    return (
      <p className="text-sm text-ink-400">The candidate withdrew this application.</p>
    );
  }
  if (status === "selected") {
    return (
      <p className="inline-flex items-center gap-fib2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Selected · final
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <p className="inline-flex items-center gap-fib2 text-sm font-semibold text-ink-500">
        <XCircle className="h-4 w-4" />
        Rejected · final
      </p>
    );
  }

  const isFinal = FINAL.includes(choice);

  return (
    <form
      action={updateApplicationStatusAction}
      className="flex flex-wrap items-center justify-end gap-fib4"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Select
        name="status"
        aria-label="Decision"
        value={choice}
        onChange={(event) => {
          setChoice(event.target.value as Reviewable);
          setConfirming(false);
        }}
        className="w-auto min-w-40 normal-case"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {REVIEWABLE_STATUS_LABELS[option]}
          </option>
        ))}
      </Select>

      {isFinal && !confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full bg-ink-900 px-fib6 py-fib3 text-sm font-semibold text-white hover:bg-ink-700"
        >
          {choice === "selected" ? "Select candidate" : "Reject"}
        </button>
      ) : (
        <SubmitButton size="sm">
          {isFinal
            ? `Confirm — ${choice === "selected" ? "select" : "reject"}`
            : "Update status"}
        </SubmitButton>
      )}

      {isFinal && confirming && (
        <label className="block basis-full space-y-fib2 text-left">
          <span className="text-xs font-semibold text-ink-600">
            Message to the candidate (optional)
          </span>
          <textarea
            name="decisionNote"
            rows={3}
            maxLength={1000}
            placeholder={
              choice === "selected"
                ? "Welcome aboard! A few things to know before you start…"
                : "Thanks for applying. Here's why we went another way…"
            }
            className="w-full rounded-lg border border-line p-fib4 text-sm"
          />
        </label>
      )}
      {isFinal && confirming && (
        <p className="flex basis-full items-center justify-end gap-fib2 text-xs text-amber-700">
          <Lock className="h-3.5 w-3.5" />
          This decision is final and can&apos;t be changed.
          {choice === "selected" && " Only one candidate can be selected per project."}
        </p>
      )}
      {selectionTaken && (
        <p className="basis-full text-right text-xs text-ink-400">
          A candidate is already selected for this project.
        </p>
      )}
    </form>
  );
}
