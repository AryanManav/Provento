"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BadgeCheck, Github, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Supabase returns server-configuration errors verbatim; candidates can't act on those. */
function describeLinkError(message: string): string {
  if (/manual linking|provider is not enabled|unsupported provider/i.test(message)) {
    return "GitHub verification isn't available yet. You can still add your GitHub link to your profile in the meantime.";
  }
  if (/already (been )?linked|identity_already_exists|already exists/i.test(message)) {
    return "That GitHub account is already linked to another Trialent account.";
  }
  return "We couldn't connect GitHub. Please try again.";
}

/**
 * Only an OAuth-linked identity counts as verified. A GitHub URL the candidate
 * typed into their profile is shown as exactly that — self-reported.
 */
export function GitHubConnect({
  verifiedUsername,
  reportedUrl,
}: {
  verifiedUsername: string | null;
  reportedUrl: string | null;
}) {
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const connect = async () => {
    setPending(true);
    setError(null);
    const { error: linkError } = await createClient().auth.linkIdentity({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}&github=1`,
      },
    });
    if (linkError) {
      setError(describeLinkError(linkError.message));
      setPending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-fib6 shadow-xs">
      <div className="flex items-center gap-fib4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-900 text-white">
          <Github className="h-5 w-5" />
        </span>
        <h2 className="font-bold text-ink-900">GitHub</h2>
      </div>

      {verifiedUsername ? (
        <a
          href={`https://github.com/${verifiedUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-fib5 flex items-center gap-fib3 rounded-xl bg-emerald-50 px-fib5 py-fib4 text-sm font-semibold text-emerald-700 hover:underline"
        >
          <BadgeCheck className="h-4 w-4 shrink-0" />
          Verified as @{verifiedUsername}
        </a>
      ) : (
        <>
          <p className="mt-fib4 text-sm text-ink-500">
            {reportedUrl
              ? "Your GitHub link is added but not verified. Verifying proves the account is yours."
              : "Verify your GitHub account to prove the code you point to is yours."}
          </p>
          <Button
            size="sm"
            onClick={connect}
            disabled={pending}
            className="mt-fib5 w-full gap-fib3"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Github className="h-4 w-4" />
                {reportedUrl ? "Verify GitHub" : "Connect GitHub"}
              </>
            )}
          </Button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-fib4 text-sm text-ink-600">
          {error}
        </p>
      )}
    </section>
  );
}
