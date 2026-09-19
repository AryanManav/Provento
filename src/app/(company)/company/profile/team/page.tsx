import { Crown, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyIdForUser, getCompanyTeam } from "@/lib/data/company";
import { Avatar } from "@/components/common/avatar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Everyone who can act for the company on Trialent. */
export default async function CompanyTeamPage() {
  const user = await requireRole(["company", "admin"]);
  const companyId = await getCompanyIdForUser(user.id);
  const team = companyId ? await getCompanyTeam(companyId) : [];

  return (
    <section className="space-y-fib5 rounded-2xl border border-line bg-surface p-fib6 shadow-xs">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Team · {team.length}</h2>
        <p className="text-sm text-ink-500">
          People who can post projects, review applicants and evaluate work for your
          company.
        </p>
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line">
        {team.map((member) => (
          <li key={member.userId} className="flex items-center gap-fib4 px-fib5 py-fib4">
            <Avatar
              name={member.fullName}
              src={member.avatarUrl}
              className="h-10 w-10 rounded-full text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900">
                {member.fullName}
                {member.userId === user.id && (
                  <span className="ml-fib2 text-xs font-normal text-ink-400">(you)</span>
                )}
              </p>
              <p className="truncate text-xs text-ink-500">
                {member.email} · joined {formatDate(member.joinedAt)}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-fib2 rounded-md bg-ink-100 px-fib4 py-fib1 text-xs font-semibold capitalize text-ink-700">
              {member.role === "owner" ? (
                <Crown className="h-3.5 w-3.5 text-accent-700" />
              ) : (
                <UserRound className="h-3.5 w-3.5" />
              )}
              {member.role}
            </span>
          </li>
        ))}
      </ul>

      <p className="rounded-xl bg-surface-muted px-fib5 py-fib4 text-sm text-ink-600">
        Inviting teammates from here isn&apos;t available yet.
      </p>
    </section>
  );
}
