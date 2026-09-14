import { requireCandidate } from "@/lib/auth/guards";
import { CandidateNav } from "@/components/layout/candidate-nav";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCandidate();

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f2ee]">
      <PublicNavbar />
      <CandidateNav user={user} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
