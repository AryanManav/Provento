"use client";

import { useState } from "react";
import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { updateApplicationStatusAction } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ApplicationStatus } from "@/lib/types/database.types";

type Step = "reviewing" | "shortlisted" | "interview";

/** Forward steps available from each stage of the hiring pipeline. */
const NEXT_STEPS: Partial<Record<ApplicationStatus, Step[]>> = {
  submitted: ["reviewing", "shortlisted", "interview"],
  reviewing: ["shortlisted", "interview"],
  shortlisted: ["interview"],
};

const STEP_LABEL: Record<Step, string> = {
  reviewing: "Start review",
  shortlisted: "Shortlist",
  interview: "Interview",
};

/**
 * The company's move on one hire-only application. Shortlist and interview
 * move it forward; Select and Reject are final, confirm first, and can carry
 * a message to the candidate. The database enforces the order and the number
 * of openings.
 */
export function HiringDecision({
  applicationId,
  status,
  openingsFilled,
  awaitingAssessment = false,
  returnTo,
  stage,
  align = "end",
}: {
  applicationId: string;
  status: ApplicationStatus;
  /** Every opening is filled, so nobody else can be selected. */
  openingsFilled: boolean;
  /**
   * The role has an assessment this candidate hasn't submitted: they can be
   * turned down, but not moved forward (the database enforces the same).
   */
  awaitingAssessment?: boolean;
  returnTo?: string;
  /** The pipeline tab to come back to. */
  stage?: string;
  align?: "start" | "end";
}) {
  const [confirming, setConfirming] = useState<"selected" | "rejected" | null>(null);

  if (status === "withdrawn") {
    return <p className="text-xs text-ink-500">Withdrawn by the candidate</p>;
  }
  if (status === "selected") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Hired · final
      </p>
    );
  }
  if (status === "rejected") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        Rejected · final
      </p>
    );
  }

  const hidden = (
    <>
      <input type="hidden" name="applicationId" value={applicationId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {stage && <input type="hidden" name="stage" value={stage} />}
    </>
  );

  if (confirming) {
    const selecting = confirming === "selected";
    return (
      <form
        action={updateApplicationStatusAction}
        className="w-full max-w-md space-y-2 rounded-lg border border-line bg-ink-50 p-3 text-left"
      >
        {hidden}
        <input type="hidden" name="status" value={confirming} />
        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink-700">
            Message to the candidate{" "}
            <span className="font-normal text-ink-400">optional</span>
          </span>
          <textarea
            name="decisionNote"
            rows={3}
            maxLength={1000}
            placeholder={
              selecting
                ? "Congratulations — here's what happens next…"
                : "Thanks for applying. Here's why we went another way…"
            }
            className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink-900"
          />
        </label>
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Final — it can&apos;t be changed.{selecting && " It fills one opening."}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(null)}
          >
            Cancel
          </Button>
          <SubmitButton size="sm" variant={selecting ? "success" : "destructive"}>
            {selecting ? "Confirm — select" : "Confirm — reject"}
          </SubmitButton>
        </div>
      </form>
    );
  }

  const rejectButton = (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-ink-600 hover:text-rose-700"
      onClick={() => setConfirming("rejected")}
    >
      Reject
    </Button>
  );

  if (awaitingAssessment) {
    return (
      <div
        className={
          align === "end"
            ? "flex flex-wrap items-center justify-end gap-2"
            : "flex flex-wrap items-center gap-2"
        }
      >
        <span className="text-xs text-ink-500">Waiting for the assessment</span>
        {rejectButton}
      </div>
    );
  }

  return (
    <div
      className={
        align === "end"
          ? "flex flex-wrap items-center justify-end gap-2"
          : "flex flex-wrap items-center gap-2"
      }
    >
      {(NEXT_STEPS[status] ?? []).map((step) => (
        <form key={step} action={updateApplicationStatusAction}>
          {hidden}
          <input type="hidden" name="status" value={step} />
          <SubmitButton size="sm" variant="outline">
            {STEP_LABEL[step]}
          </SubmitButton>
        </form>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-emerald-700"
        disabled={openingsFilled}
        title={openingsFilled ? "Every opening is filled" : undefined}
        onClick={() => setConfirming("selected")}
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Select
      </Button>
      {rejectButton}
    </div>
  );
}
