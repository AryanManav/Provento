import { updateApplicationStatusAction } from "@/lib/actions/company";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { REVIEWABLE_APPLICATION_STATUSES } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types/database.types";

export function ApplicationStatusForm({
  applicationId,
  status,
  returnTo,
}: {
  applicationId: string;
  status: ApplicationStatus;
  /** Where to land afterwards; the action only honours this project's applicant pages. */
  returnTo?: string;
}) {
  if (status === "withdrawn") {
    return (
      <p className="text-sm text-ink-400">The candidate withdrew this application.</p>
    );
  }

  return (
    <form
      action={updateApplicationStatusAction}
      className="flex flex-wrap items-center gap-fib4"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Select
        name="status"
        aria-label="Application status"
        defaultValue={
          (REVIEWABLE_APPLICATION_STATUSES as readonly string[]).includes(status)
            ? status
            : "reviewing"
        }
        className="w-auto min-w-40"
      >
        {REVIEWABLE_APPLICATION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <SubmitButton size="sm">Update status</SubmitButton>
    </form>
  );
}
