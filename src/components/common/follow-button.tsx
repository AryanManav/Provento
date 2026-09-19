"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { setFollowAction } from "@/lib/actions/follows";
import { cn } from "@/lib/utils";
import type { FollowTarget } from "@/lib/validations";
import type { FollowStats } from "@/lib/types/domain";

/**
 * Follow / Following toggle with the follower count. Updates at once and rolls
 * back if the server refuses.
 */
export function FollowButton({
  target,
  initial,
  followLabel = "Follow",
}: {
  target: FollowTarget;
  initial: FollowStats;
  followLabel?: string;
}) {
  const [stats, setStats] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !stats.following;
    const previous = stats;
    setError(null);
    setStats({
      following: next,
      followers: Math.max(0, stats.followers + (next ? 1 : -1)),
    });
    startTransition(async () => {
      const result = await setFollowAction(target, next);
      if (result.error) {
        setStats(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-fib1">
      <div className="flex items-center gap-fib3">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={stats.following}
          className={cn(
            "inline-flex items-center gap-fib2 rounded-full px-fib5 py-fib3 text-sm font-semibold transition-colors disabled:opacity-70",
            stats.following
              ? "border border-line bg-white text-ink-700 hover:border-rose-200 hover:text-rose-700"
              : "bg-brand-600 text-white hover:bg-brand-700"
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : stats.following ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {stats.following ? "Following" : followLabel}
        </button>
        <span className="text-sm text-ink-500">
          <span className="font-semibold text-ink-800">{stats.followers}</span> follower
          {stats.followers === 1 ? "" : "s"}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
