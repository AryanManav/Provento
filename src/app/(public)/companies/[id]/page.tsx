import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Globe,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanyIdForUser, getCompanyPublicProfile } from "@/lib/data/company";
import { getFollowStats } from "@/lib/data/directory";
import { FollowButton } from "@/components/common/follow-button";
import { Avatar } from "@/components/common/avatar";
import { StatCard } from "@/components/common/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { COMPANY_WORK_STYLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * A startup as a candidate sees it before deciding to do paid work for it: who
 * they are, how past evaluations went (counts only), and what they're hiring
 * for now.
 */
export default async function CompanyPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  // Company details are readable by signed-in users only (RLS).
  if (!user) redirect(`/login?redirect=/companies/${id}`);

  const [company, followStats, viewerCompanyId] = await Promise.all([
    getCompanyPublicProfile(id),
    getFollowStats({ companyId: id }),
    user.role === "company" ? getCompanyIdForUser(user.id) : Promise.resolve(null),
  ]);
  if (!company) notFound();
  const ownCompany = viewerCompanyId === company.id;

  const { trackRecord: record } = company;
  const meta = [
    company.industry && { icon: Building2, text: company.industry },
    company.size && { icon: Users, text: `${company.size} people` },
    company.location && { icon: MapPin, text: company.location },
    company.foundedYear && { icon: CalendarDays, text: `Founded ${company.foundedYear}` },
    { icon: CalendarDays, text: `On Trialent since ${formatDate(company.memberSince)}` },
  ].filter(Boolean) as { icon: typeof Building2; text: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-fib6 px-fib5 py-fib7 sm:px-fib6">
      <Link
        href="/projects"
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        ← All projects
      </Link>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-dot-grid" />
        <div className="px-fib6 pb-fib6">
          <div className="-mt-12 flex flex-col gap-fib4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar
              name={company.name}
              src={company.logoUrl}
              className="h-24 w-24 rounded-2xl text-2xl ring-4 ring-white shadow-md"
            />
            {!ownCompany && (
              <FollowButton target={{ companyId: company.id }} initial={followStats} />
            )}
          </div>
          <div className="mt-fib5 space-y-fib4">
            <div className="flex flex-wrap items-center gap-fib3">
              <h1 className="text-2xl font-bold text-ink-900">{company.name}</h1>
              {company.verified && (
                <span className="inline-flex items-center gap-fib2 rounded-full bg-emerald-50 px-fib4 py-fib1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-fib5 gap-y-fib2 text-sm text-ink-500">
              {meta.map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-fib2">
                  <Icon className="h-4 w-4 text-ink-400" />
                  {text}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-fib5 gap-y-fib2">
              {[
                { href: company.linkedinUrl, label: "LinkedIn" },
                { href: company.githubUrl, label: "GitHub" },
                { href: company.careersUrl, label: "Careers" },
              ]
                .filter((link): link is { href: string; label: string } => !!link.href)
                .map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-600 hover:underline"
                  >
                    {link.label} ↗
                  </a>
                ))}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-fib2 text-sm font-semibold text-brand-600 hover:underline"
              >
                <Globe className="h-4 w-4" />
                {hostname(company.website)}
              </a>
            )}
            <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {company.description || "This startup hasn't written about itself yet."}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-fib4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Track record on Trialent</h2>
          <p className="text-sm text-ink-500">
            How this startup&apos;s past paid evaluations went. Counts only — individual
            results stay private.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-fib5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Evaluations completed"
            value={record.completedEvaluations}
            hint="Paid projects taken to the end"
            icon={ClipboardCheck}
          />
          <StatCard
            label="Hires"
            value={record.hires}
            hint="Evaluations that ended in a hire"
            icon={Trophy}
            tone="positive"
          />
          <StatCard
            label="Interviews"
            value={record.interviews}
            hint="Evaluations that led to an interview"
            icon={Users}
          />
          <StatCard
            label="Cancelled"
            value={record.cancelledProjects}
            hint="Projects closed without finishing"
            icon={Clock}
          />
        </div>
        {record.completedEvaluations === 0 && (
          <p className="rounded-xl border border-line bg-surface-muted px-fib5 py-fib4 text-sm text-ink-600">
            New to Trialent — no finished evaluations yet. Use the brief and the
            clarification thread to judge the project before committing your time.
          </p>
        )}
      </section>

      {(company.techStack.length > 0 ||
        company.workStyle ||
        company.perks ||
        company.hiringProcess) && (
        <section className="grid gap-fib5 md:grid-cols-2">
          {(company.techStack.length > 0 || company.workStyle) && (
            <div className="space-y-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs">
              <h2 className="font-bold text-ink-900">Stack and way of working</h2>
              {company.workStyle && (
                <p className="text-sm text-ink-600">
                  Works{" "}
                  <span className="font-semibold text-ink-900">
                    {COMPANY_WORK_STYLES[company.workStyle].toLowerCase()}
                  </span>
                </p>
              )}
              {company.techStack.length > 0 && (
                <div className="flex flex-wrap gap-fib2">
                  {company.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-brand-50 px-fib4 py-fib1 text-xs font-semibold text-brand-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {company.hiringProcess && (
            <div className="space-y-fib3 rounded-2xl border border-line bg-white p-fib6 shadow-xs">
              <h2 className="font-bold text-ink-900">Hiring process</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {company.hiringProcess}
              </p>
            </div>
          )}
          {company.perks && (
            <div className="space-y-fib3 rounded-2xl border border-line bg-white p-fib6 shadow-xs">
              <h2 className="font-bold text-ink-900">Perks and benefits</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {company.perks}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="space-y-fib4">
        <h2 className="text-lg font-bold text-ink-900">
          Open projects · {company.openProjects.length}
        </h2>
        {company.openProjects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-fib6 text-center text-sm text-ink-500">
            No projects taking applications right now.
          </p>
        ) : (
          <div className="grid gap-fib4 md:grid-cols-2">
            {company.openProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group flex flex-col justify-between gap-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs transition-colors hover:border-brand-300"
              >
                <div className="space-y-fib2">
                  <h3 className="font-semibold text-ink-900">{project.title}</h3>
                  <p className="line-clamp-2 text-sm text-ink-500">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-fib3 text-sm">
                  <span className="flex items-center gap-fib3 text-ink-500">
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(project.paymentAmount, project.currency)}
                    </span>
                    · {project.expectedHours}h · Apply by{" "}
                    {formatDate(project.applicationDeadline)}
                  </span>
                  <span className="inline-flex items-center gap-fib2 font-semibold text-brand-600 group-hover:underline">
                    View brief
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {user.role === "candidate" && (
        <p className="flex items-center gap-fib3 text-sm text-ink-500">
          <BriefcaseBusiness className="h-4 w-4" />
          Applying doesn&apos;t commit you — you can withdraw any time before you&apos;re
          selected.
        </p>
      )}
    </div>
  );
}
