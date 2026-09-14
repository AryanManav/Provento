import { requireCandidate } from "@/lib/auth/guards";
import { CandidateNav } from "@/components/layout/candidate-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCandidate();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="flex flex-1">
        <CandidateNav user={user} />
        <main className="flex-1 p-6 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
