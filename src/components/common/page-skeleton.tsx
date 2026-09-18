/**
 * Shown by route `loading.tsx` files the instant a link is clicked, while the
 * server renders the page. The surrounding layout (navbar, sidebar) stays put.
 */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-fib6">
      <div className="space-y-fib3 border-b border-line pb-fib6">
        <div className="h-7 w-56 rounded-lg bg-ink-100" />
        <div className="h-4 w-80 max-w-full rounded bg-ink-100" />
      </div>
      <div className="grid gap-fib5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-2xl border border-line bg-white" />
        ))}
      </div>
      <div className="space-y-fib4">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-fib5 rounded-2xl border border-line bg-white p-fib6"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-ink-100" />
            <div className="flex-1 space-y-fib3">
              <div className="h-4 w-1/3 rounded bg-ink-100" />
              <div className="h-3 w-2/3 rounded bg-ink-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
