import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowDown,
  BadgeCheck,
  Building2,
  CalendarDays,
  FolderKanban,
  MapPin,
  Pencil,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanyIdForUser, getCompanyPublicProfile } from "@/lib/data/company";
import { getFollowStats } from "@/lib/data/directory";
import { COMPANY_WORK_STYLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/common/follow-button";
import { SectionCard } from "@/components/common/section-card";
import { EmptyState } from "@/components/common/empty-state";
import { ProfileHeader, type ProfileLink } from "@/components/profile/profile-header";
import { ProjectResultRow, SkillTags } from "@/components/search/result-rows";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * A startup's public identity: who they are, what they build with, what
 * they're offering now, and how their past evaluations went (counts only).
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

  const links = [
    company.website && { href: company.website, label: hostname(company.website) },
    company.linkedinUrl && { href: company.linkedinUrl, label: "LinkedIn" },
    company.githubUrl && { href: company.githubUrl, label: "GitHub" },
    company.careersUrl && { href: company.careersUrl, label: "Careers" },
  ].filter((link): link is ProfileLink => Boolean(link));

  const facts = [
    company.size && { icon: Users, text: `${company.size} people` },
    company.location && { icon: MapPin, text: company.location },
    company.foundedYear && { icon: CalendarDays, text: `Founded ${company.foundedYear}` },
  ].filter((fact): fact is { icon: typeof Users; text: string } => Boolean(fact));

  const track = [
    {
      label: "Evaluations completed",
      value: record.completedEvaluations,
      hint: "Paid projects taken to a decision",
    },
    { label: "Interviews", value: record.interviews, hint: "After an evaluation" },
    { label: "Hires", value: record.hires, hint: "After an evaluation" },
    {
      label: "Cancelled projects",
      value: record.cancelledProjects,
      hint: "Closed without finishing",
    },
  ];

  return (
    <div className="bg-ink-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <ProfileHeader
          name={company.name}
          imageUrl={company.logoUrl}
          shape="square"
          headline={company.industry}
          badges={
            company.verified && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                Verified company
              </span>
            )
          }
          facts={facts}
          links={links}
          stats={[
            { label: "open projects", value: company.openProjects.length },
            { label: "evaluations completed", value: record.completedEvaluations },
            { label: "on Trialent since", value: formatDate(company.memberSince) },
          ]}
          actions={
            ownCompany ? (
              <Link href="/company/profile">
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit company profile
                </Button>
              </Link>
            ) : (
              <>
                {company.openProjects.length > 0 && (
                  <a href="#projects">
                    <Button variant="outline" size="sm">
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      View open projects
                    </Button>
                  </a>
                )}
                <FollowButton target={{ companyId: company.id }} initial={followStats} />
              </>
            )
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SectionCard title="About" icon={Building2}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {company.description ||
                  `${company.name} hasn't written about itself yet.`}
              </p>
            </SectionCard>

            <section
              id="projects"
              aria-labelledby="projects-title"
              className="scroll-mt-20 space-y-3"
            >
              <h2
                id="projects-title"
                className="flex items-center gap-2 text-base font-semibold text-ink-900"
              >
                <FolderKanban className="h-4 w-4 text-ink-400" aria-hidden />
                Open projects
                <span className="tabular rounded bg-ink-100 px-1.5 text-2xs font-medium text-ink-500">
                  {company.openProjects.length}
                </span>
              </h2>
              {company.openProjects.length === 0 ? (
                <EmptyState
                  compact
                  icon={FolderKanban}
                  title="No open projects right now"
                  description={
                    ownCompany
                      ? "Post a paid project to start evaluating candidates."
                      : `Follow ${company.name} to be notified when they post one.`
                  }
                  actionText={ownCompany ? "Post a project" : undefined}
                  actionHref={ownCompany ? "/company/projects/create" : undefined}
                />
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                  {company.openProjects.map((project) => (
                    <ProjectResultRow key={project.id} project={project} />
                  ))}
                </ul>
              )}
            </section>

            {company.hiringProcess && (
              <SectionCard title="How they hire">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {company.hiringProcess}
                </p>
              </SectionCard>
            )}
            {company.perks && (
              <SectionCard title="Perks and benefits">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {company.perks}
                </p>
              </SectionCard>
            )}
          </div>

          <aside className="space-y-6">
            {(company.techStack.length > 0 || company.workStyle) && (
              <SectionCard title="Tech and ways of working">
                <div className="space-y-3">
                  {company.techStack.length > 0 && (
                    <SkillTags skills={company.techStack} limit={20} />
                  )}
                  {company.workStyle && (
                    <p className="text-sm text-ink-600">
                      Works{" "}
                      <span className="font-medium text-ink-900">
                        {COMPANY_WORK_STYLES[company.workStyle].toLowerCase()}
                      </span>
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Track record"
              description="How past paid evaluations went. Counts only — individual results stay private."
            >
              <dl className="-my-1 divide-y divide-line">
                {track.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <dt>
                      <span className="block text-sm text-ink-700">{item.label}</span>
                      <span className="block text-xs text-ink-400">{item.hint}</span>
                    </dt>
                    <dd className="tabular text-base font-semibold text-ink-900">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {record.completedEvaluations === 0 && (
                <p className="mt-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
                  New to Trialent — no finished evaluations yet. Use the brief and the
                  clarification thread to judge a project before committing your time.
                </p>
              )}
            </SectionCard>

            {user.role === "candidate" && (
              <p className="px-1 text-xs text-ink-500">
                Applying doesn&apos;t commit you — you can withdraw any time before
                you&apos;re selected.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
