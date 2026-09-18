import type { ThreadEvidence } from "@/lib/types/domain";

interface ThreadEntry {
  authorRole: "candidate" | "company";
  createdAt: string;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * How quickly the candidate answered the company.
 *
 * The clock starts at the first company message the candidate hasn't answered
 * yet and stops at their next message, so three follow-ups in a row count as one
 * wait, measured from the first. This is the "responded within 6 hours" fact
 * the product records instead of a subjective communication score.
 */
export function computeThreadEvidence(entries: ThreadEntry[]): ThreadEvidence {
  const ordered = [...entries].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );

  const waits: number[] = [];
  let waitingSince: number | null = null;

  for (const entry of ordered) {
    const at = Date.parse(entry.createdAt);
    if (entry.authorRole === "company") {
      waitingSince ??= at;
    } else if (waitingSince !== null) {
      waits.push(at - waitingSince);
      waitingSince = null;
    }
  }

  return {
    messages: ordered.length,
    companyQuestions: ordered.filter((entry) => entry.authorRole === "company").length,
    candidateReplies: waits.length,
    candidateMedianResponseMs: median(waits),
  };
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round(hours / 24)} days`;
}
