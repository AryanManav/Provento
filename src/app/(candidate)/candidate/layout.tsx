import { requireCandidate } from "@/lib/auth/guards";
import { CandidateNav } from "@/components/layout/candidate-nav";
import { SiteShell, Workspace } from "@/components/layout/site-shell";
import { getNotificationSummary } from "@/lib/data/notifications";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCandidate();
  const notifications = await getNotificationSummary(user.id);

  return (
    <SiteShell>
      <Workspace nav={<CandidateNav notifications={notifications} />}>
        {children}
      </Workspace>
    </SiteShell>
  );
}
