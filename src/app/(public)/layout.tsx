import { SiteShell } from "@/components/layout/site-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <main className="flex-1 min-h-[32rem]">{children}</main>
    </SiteShell>
  );
}
