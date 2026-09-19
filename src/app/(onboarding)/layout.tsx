import { SiteShell } from "@/components/layout/site-shell";

/** First-run steps: the site frame without a workspace sidebar. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <main className="flex-1 bg-surface-muted px-fib5 py-fib7 sm:px-fib6">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </SiteShell>
  );
}
