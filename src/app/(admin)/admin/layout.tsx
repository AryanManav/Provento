import { requireAdmin } from "@/lib/auth/guards";
import { AdminNav } from "@/components/layout/admin-nav";
import { SiteShell, Workspace } from "@/components/layout/site-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <SiteShell>
      <Workspace nav={<AdminNav />}>{children}</Workspace>
    </SiteShell>
  );
}
