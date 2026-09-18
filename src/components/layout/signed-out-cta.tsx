import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/guards";
import { dashboardFor } from "@/lib/constants";

/**
 * Marketing calls to action only make sense to a visitor. Asking a signed-in
 * startup to "prove your skills as a candidate" is the same wrong-audience
 * problem as showing them candidate nav links.
 */
export async function SignedOutCta({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <>{children}</>;

  return (
    <Link href={dashboardFor(user.role)}>
      <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-md">
        <span>Go to your dashboard</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
