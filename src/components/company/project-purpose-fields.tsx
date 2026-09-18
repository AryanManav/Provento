"use client";

import { useState } from "react";
import { Briefcase, Hammer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_OPENINGS, PROJECT_PURPOSES } from "@/lib/constants";
import type { ProjectPurpose } from "@/lib/types/database.types";

const ICONS = { hire: Briefcase, build: Hammer } as const;

/** Hire vs build-only, and how many candidates a hiring project may select. */
export function ProjectPurposeFields() {
  const [purpose, setPurpose] = useState<ProjectPurpose>("hire");

  return (
    <fieldset className="space-y-fib4">
      <legend className="text-xs font-semibold uppercase tracking-wider text-ink-500">
        What is this project for?
      </legend>
      <div className="grid gap-fib4 sm:grid-cols-2">
        {(Object.keys(PROJECT_PURPOSES) as ProjectPurpose[]).map((value) => {
          const Icon = ICONS[value];
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer gap-fib4 rounded-xl border p-fib5 transition-colors",
                purpose === value
                  ? "border-brand-600 bg-brand-50"
                  : "border-line hover:border-ink-300"
              )}
            >
              <input
                type="radio"
                name="purpose"
                value={value}
                checked={purpose === value}
                onChange={() => setPurpose(value)}
                className="mt-fib1"
              />
              <span>
                <span className="flex items-center gap-fib2 text-sm font-semibold text-ink-900">
                  <Icon className="h-4 w-4" />
                  {PROJECT_PURPOSES[value].label}
                </span>
                <span className="mt-fib1 block text-xs text-ink-500">
                  {PROJECT_PURPOSES[value].description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {purpose === "hire" ? (
        <div className="max-w-xs space-y-fib2">
          <label htmlFor="openings" className="text-sm font-semibold text-ink-800">
            Openings — how many candidates you may select
          </label>
          <Input
            id="openings"
            name="openings"
            type="number"
            min={1}
            max={MAX_OPENINGS}
            defaultValue={1}
            required
          />
          <p className="text-xs text-ink-400">
            Each selected candidate is paid the project fee.
          </p>
        </div>
      ) : (
        <input type="hidden" name="openings" value={1} />
      )}
    </fieldset>
  );
}
