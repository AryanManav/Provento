import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Building2, MapPin, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanyDirectory } from "@/lib/data/company";
import { COMPANY_WORK_STYLES, companyProfilePath } from "@/lib/constants";
import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Every startup on Trialent, so candidates can check who they'd work for. */
export default async function CompanyDirectoryPage() {
  const user = await getCurrentUser();
  // Company details are readable by signed-in users only (RLS).
  if (!user) redirect("/login?redirect=/companies");

  const companies = await getCompanyDirectory();
  const hiring = companies.filter((company) => company.openProjects > 0).length;

  return (
    <div className="mx-auto max-w-6xl space-y-fib6 px-fib5 py-fib7 sm:px-fib6">
      <div className="border-b border-line pb-fib6">
        <h1 className="text-3xl font-semibold text-ink-900">Companies</h1>
        <p className="mt-fib2 text-sm text-ink-500">
          {companies.length} startup{companies.length === 1 ? "" : "s"} on Trialent ·{" "}
          {hiring} with open projects right now. Check who you&apos;d work for before you
          apply.
        </p>
      </div>

      {companies.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-fib8 text-center text-sm text-ink-500">
          No companies yet.
        </p>
      ) : (
        <div className="grid gap-fib4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={companyProfilePath(company.id)}
              className="group flex flex-col gap-fib4 rounded-2xl border border-line bg-surface p-fib6 shadow-xs transition-all hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center gap-fib4">
                <Avatar
                  name={company.name}
                  src={company.logoUrl}
                  className="h-12 w-12 rounded-xl text-base"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-fib2 truncate font-semibold text-ink-900 group-hover:text-brand-700">
                    {company.name}
                    {company.verified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {company.industry ?? "Startup"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-fib4 gap-y-fib2 text-xs text-ink-500">
                {company.location && (
                  <span className="inline-flex items-center gap-fib1">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.location}
                  </span>
                )}
                {company.size && (
                  <span className="inline-flex items-center gap-fib1">
                    <Users className="h-3.5 w-3.5" />
                    {company.size}
                  </span>
                )}
                {company.workStyle && (
                  <span className="inline-flex items-center gap-fib1">
                    <Building2 className="h-3.5 w-3.5" />
                    {COMPANY_WORK_STYLES[company.workStyle]}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "mt-auto self-start rounded-md px-1.5 py-0.5 text-xs font-medium",
                  company.openProjects > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-ink-100 text-ink-500"
                )}
              >
                {company.openProjects > 0
                  ? `${company.openProjects} open project${company.openProjects === 1 ? "" : "s"}`
                  : "No open projects"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
