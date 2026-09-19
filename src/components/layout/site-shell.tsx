import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { getCurrentUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

/**
 * The one frame every page sits in — public pages and signed-in areas alike —
 * so navigation never changes shape between routes. No `overflow` here: a
 * scroll container would break the sticky navbar.
 */
export async function SiteShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  /** Signed-in tools drop the marketing footer. */
  footer?: boolean;
}) {
  const user = await getCurrentUser();
  return (
    // Signed-in phones have a fixed bottom bar; keep content clear of it.
    <div
      className={cn(
        "flex min-h-screen w-full flex-col bg-surface",
        user && "pb-14 md:pb-0"
      )}
    >
      <PublicNavbar />
      {children}
      {footer && <PublicFooter />}
    </div>
  );
}

/** A signed-in page's content column, on the workspace's grey surface. */
export function Workspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-canvas">
      <main
        id="main"
        className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
