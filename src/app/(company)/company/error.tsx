"use client";

import { ErrorState } from "@/components/common/error-state";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-4 py-10">
      <ErrorState
        reset={reset}
        digest={error.digest}
        homeHref="/company/dashboard"
        homeLabel="Dashboard"
      />
    </div>
  );
}
