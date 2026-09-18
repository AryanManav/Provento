import { requireAdmin } from "@/lib/auth/guards";

import { EmptyState } from "@/components/common/empty-state";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-300 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          User Moderation & Access Control
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review candidates, company founders, and team members.
        </p>
      </div>

      <EmptyState
        title="No user records loaded"
        description="Users will appear here as they register on Trialent."
      />
    </div>
  );
}
