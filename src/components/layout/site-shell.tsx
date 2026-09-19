import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { getCurrentUser } from "@/lib/auth/guards";
import { Suspense } from "react";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import type { NavLink } from "@/lib/constants";
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

/**
 * A signed-in page's content column, on the workspace's grey surface. With
 * `sidebar`, the role's sections run down the left on desktop.
 */
export function Workspace({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: NavLink[];
}) {
  if (!sidebar || sidebar.length === 0) {
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
  return (
    <div className="flex-1 bg-canvas">
      <div className="mx-auto flex w-full max-w-[1280px] gap-8 px-4 sm:px-6 lg:px-8">
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-14 py-6">
            <Suspense>
              <WorkspaceSidebar links={sidebar} />
            </Suspense>
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 pb-12 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
