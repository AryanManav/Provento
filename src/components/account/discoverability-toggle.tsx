"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setDiscoverableAction } from "@/lib/actions/follows";
import { cn } from "@/lib/utils";

/** A candidate's switch for appearing in search and having a public profile. */
export function DiscoverabilityToggle({
  initial,
  profileHref,
}: {
  initial: boolean;
  profileHref: string | null;
}) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await setDiscoverableAction(next);
      if (result.error) {
        setOn(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-fib3">
      <label className="flex cursor-pointer items-start justify-between gap-fib5">
        <span>
          <span className="block text-sm font-semibold text-ink-900">
            Show my profile in search
          </span>
          <span className="block text-sm text-ink-500">
            Startups and other candidates can find you and follow you. Your email, resume
            and applications are never shown.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={pending}
          onClick={toggle}
          className={cn(
            "relative mt-fib1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
            on ? "bg-brand-600" : "bg-ink-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
              on ? "left-[1.375rem]" : "left-0.5"
            )}
          />
        </button>
      </label>
      {on && profileHref && (
        <Link
          href={profileHref}
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          See your public profile →
        </Link>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
