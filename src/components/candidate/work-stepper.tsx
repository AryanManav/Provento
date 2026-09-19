import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectionWorkStatus } from "@/lib/types/database.types";

const STEPS = ["Selected", "Building", "Submitted", "Under review", "Decision"] as const;

/** Where the candidate's work is, as the index of the current step. */
function currentStep(status: SelectionWorkStatus): number {
  switch (status) {
    case "in_progress":
    case "revision_requested":
      return 1;
    case "submitted":
      return 2;
    case "under_review":
      return 3;
    default:
      return 4;
  }
}

/** The project's lifecycle for this candidate, from selection to decision. */
export function WorkStepper({ status }: { status: SelectionWorkStatus }) {
  const current = currentStep(status);
  const finished = current === 4;

  return (
    <ol className="flex items-center gap-2" aria-label="Project progress">
      {STEPS.map((step, index) => {
        const done = index < current || (finished && index === current);
        const active = index === current && !finished;
        return (
          <li key={step} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-2xs font-semibold",
                  done && "border-brand-600 bg-brand-600 text-white",
                  active &&
                    "border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100",
                  !done && !active && "border-ink-300 bg-white text-ink-400"
                )}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-xs sm:inline",
                  active
                    ? "font-medium text-ink-900"
                    : done
                      ? "text-ink-600"
                      : "text-ink-400"
                )}
              >
                {step}
                {status === "revision_requested" && index === 1 && " (revision)"}
              </span>
              <span className="sr-only">
                {done ? "(done)" : active ? "(current)" : "(upcoming)"}
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1",
                  index < current ? "bg-brand-300" : "bg-ink-200"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
