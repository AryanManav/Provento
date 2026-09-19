"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * What a route shows when rendering fails: what happened in plain words, a
 * retry, and a way out. The error's digest is shown so support can find it.
 */
export function ErrorState({
  reset,
  digest,
  homeHref = "/",
  homeLabel = "Go home",
}: {
  reset: () => void;
  digest?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-line bg-white px-6 py-12 text-center"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-3 text-base font-semibold text-ink-900">
        This page couldn&apos;t load
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Something went wrong on our side. Your work is safe — try again, and if it keeps
        happening, come back in a few minutes.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Link href={homeHref}>
          <Button variant="outline">{homeLabel}</Button>
        </Link>
      </div>
      {digest && <p className="mt-4 font-mono text-2xs text-ink-400">Ref {digest}</p>}
    </div>
  );
}
