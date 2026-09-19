"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

/**
 * The candidate's own tick-list of the brief's requirements, with a progress
 * bar. It's a personal planning aid kept in this browser — the startup never
 * sees it and it isn't evidence; the submission is.
 */
export function RequirementChecklist({
  projectId,
  requirements,
  readOnly = false,
}: {
  projectId: string;
  requirements: string[];
  /** After submission the list is shown but no longer edited. */
  readOnly?: boolean;
}) {
  const storageKey = `trialent:checklist:${projectId}`;
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setDone(new Set(JSON.parse(saved) as number[]));
    } catch {
      // Unavailable storage just means the list starts empty.
    }
  }, [storageKey]);

  const toggle = (index: number) => {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // Not saved; still toggles for this visit.
      }
      return next;
    });
  };

  const count = requirements.filter((_, index) => done.has(index)).length;
  const percent = requirements.length ? (count / requirements.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink-900">Your progress</p>
        <p className="tabular text-sm text-ink-600">
          {count} of {requirements.length} · {Math.round(percent)}%
        </p>
      </div>
      <ProgressBar
        value={percent}
        label="Requirements you've ticked off"
        className="mt-2"
        tone={count === requirements.length ? "success" : "brand"}
      />
      <ul className="mt-4 space-y-1">
        {requirements.map((requirement, index) => {
          const checked = done.has(index);
          return (
            <li key={`${index}-${requirement}`}>
              <label
                className={cn(
                  "flex items-start gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                  readOnly ? "cursor-default" : "cursor-pointer hover:bg-ink-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={readOnly}
                  onChange={() => toggle(index)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand-600"
                />
                <span
                  className={cn(checked ? "text-ink-500 line-through" : "text-ink-800")}
                >
                  {requirement}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-400">
        Only you see this checklist. It&apos;s saved in this browser.
      </p>
    </div>
  );
}
