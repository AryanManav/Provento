import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";

export default async function AdminCompaniesPage() {
  const user = await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-300 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Company Verification
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Verify startup profiles to ensure credible hiring projects and prevent spam.
        </p>
      </div>

      <EmptyState
        title="No unverified companies"
        description="Companies registering on the platform will appear here for verification review."
      />
    </div>
  );
}
