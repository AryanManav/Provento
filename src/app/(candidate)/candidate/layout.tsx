import { requireCandidate } from "@/lib/auth/guards";
import { SiteShell, Workspace } from "@/components/layout/site-shell";
import { navigationFor } from "@/lib/constants";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCandidate();

  return (
    <SiteShell footer={false}>
      <Workspace sidebar={navigationFor("candidate")?.sidebar}>{children}</Workspace>
    </SiteShell>
  );
}
