import { requireCandidate } from "@/lib/auth/guards";
import { SiteShell, Workspace } from "@/components/layout/site-shell";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCandidate();

  return (
    <SiteShell footer={false}>
      <Workspace>{children}</Workspace>
    </SiteShell>
  );
}
