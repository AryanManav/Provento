"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import { setFollowAction } from "@/lib/actions/follows";
import { cn } from "@/lib/utils";
import type { FollowTarget } from "@/lib/validations";

/**
 * Follow → Following. Following shows "Unfollow" on hover, and unfollowing
 * asks once, so a stray click can't drop a connection. The change shows at
 * once, rolls back if the server refuses, and refreshes the page so every
 * count on it agrees.
 */
export function FollowButton({
  target,
  following: initialFollowing,
  name,
  size = "default",
}: {
  target: FollowTarget;
  following: boolean;
  /** Who is being followed, for the accessible label and the confirmation. */
  name: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setFollowing(initialFollowing), [initialFollowing]);
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const change = (next: boolean) => {
    setError(null);
    setConfirming(false);
    setFollowing(next);
    startTransition(async () => {
      const result = await setFollowAction(target, next);
      if (result.error) {
        setFollowing(!next);
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const height = size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm";

  if (confirming) {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        role="group"
        aria-label={`Unfollow ${name}?`}
      >
        <button
          ref={confirmRef}
          type="button"
          onClick={() => change(false)}
          className={cn(
            "inline-flex items-center rounded-lg bg-rose-600 font-medium text-white transition-colors hover:bg-rose-700",
            height
          )}
        >
          Unfollow
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={cn(
            "inline-flex items-center rounded-lg font-medium text-ink-600 transition-colors hover:bg-ink-100",
            height
          )}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => (following ? setConfirming(true) : change(true))}
        disabled={pending}
        aria-pressed={following}
        aria-label={following ? `Following ${name}. Unfollow?` : `Follow ${name}`}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
          height,
          following
            ? "border border-ink-200 bg-white text-ink-800 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            : "bg-brand-600 text-white shadow-xs hover:bg-brand-700"
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : following ? (
          <Check className="h-3.5 w-3.5 group-hover:hidden" aria-hidden />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden />
        )}
        {following ? (
          <>
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
          </>
        ) : (
          "Follow"
        )}
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </span>
  );
}
