import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

/**
 * The one frame every page sits in — public pages and signed-in workspaces
 * alike — so the navbar never moves between routes. Page-as-card: the site is
 * inset on a grey backdrop. `overflow-clip` rounds the corners without creating
 * a scroll container, which would break the sticky navbar and sidebar.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-100 sm:p-fib4">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col overflow-clip bg-surface shadow-sm sm:min-h-[calc(100vh-1rem)] sm:rounded-2xl">
        <PublicNavbar />
        {children}
        <PublicFooter />
      </div>
    </div>
  );
}

/** A signed-in area: its sidebar beside a centred content column. */
export function Workspace({
  nav,
  children,
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col border-t border-line bg-surface-muted md:flex-row">
      {nav}
      <main className="min-h-[32rem] w-full min-w-0 flex-1 px-fib5 py-fib6 sm:px-fib6 md:px-fib7 md:py-fib7">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
