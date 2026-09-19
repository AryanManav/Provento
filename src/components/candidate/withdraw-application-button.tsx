"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { withdrawApplicationAction } from "@/lib/actions/candidate";

/** Two-step so a stray click can't withdraw an application. */
export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-ink-500 transition-colors hover:text-rose-700"
      >
        Withdraw
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-fib4 text-xs">
      <span className="text-ink-600">
        Withdraw? The startup will see it as withdrawn.
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await withdrawApplicationAction(applicationId);
          if (result.error) {
            setError(result.error);
            setPending(false);
          } else {
            router.refresh();
          }
        }}
        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        Withdraw
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="font-medium text-ink-500 hover:text-ink-800"
      >
        Keep it
      </button>
      {error && (
        <span role="alert" className="basis-full text-rose-700">
          {error}
        </span>
      )}
    </div>
  );
}
