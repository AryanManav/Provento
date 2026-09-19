import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BadgeCheck,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCandidatePublicProfile, getFollowStats } from "@/lib/data/directory";
import { Avatar } from "@/components/common/avatar";
import { FollowButton } from "@/components/common/follow-button";

export const dynamic = "force-dynamic";

/**
 * A candidate's public profile: what they've built and what they know. Only
 * candidates who keep "Show my profile in search" on have one, and it never
 * includes contact details.
 */
export default async function CandidatePublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/candidates/${id}`);

  const [candidate, stats] = await Promise.all([
    getCandidatePublicProfile(id),
    getFollowStats({ candidateId: id }),
  ]);
  if (!candidate) notFound();

  const links = [
    { href: candidate.githubUrl, label: "GitHub" },
    { href: candidate.portfolioUrl, label: "Portfolio" },
    { href: candidate.linkedinUrl, label: "LinkedIn" },
  ].filter((link): link is { href: string; label: string } => !!link.href);

  return (
    <div className="mx-auto max-w-4xl space-y-fib6 px-fib5 py-fib7 sm:px-fib6">
      <Link href="/search" className="text-sm font-medium text-brand-600 hover:underline">
        ← Search
      </Link>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        {candidate.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={candidate.bannerUrl} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-32 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-dot-grid" />
        )}
        <div className="space-y-fib4 px-fib6 pb-fib6">
          <div className="-mt-12 flex flex-col gap-fib4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar
              name={candidate.fullName}
              src={candidate.avatarUrl}
              className="h-24 w-24 rounded-full text-2xl ring-4 ring-white shadow-md"
            />
            {candidate.isSelf ? (
              <Link
                href="/candidate/profile"
                className="rounded-full border border-line px-fib5 py-fib3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                Edit your profile
              </Link>
            ) : (
              <FollowButton target={{ candidateId: candidate.id }} initial={stats} />
            )}
          </div>

          <div className="space-y-fib2">
            <h1 className="text-2xl font-bold text-ink-900">{candidate.fullName}</h1>
            {candidate.headline && <p className="text-ink-600">{candidate.headline}</p>}
            <div className="flex flex-wrap gap-x-fib5 gap-y-fib2 text-sm text-ink-500">
              {candidate.location && (
                <span className="inline-flex items-center gap-fib2">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </span>
              )}
              {candidate.education && (
                <span className="inline-flex items-center gap-fib2">
                  <GraduationCap className="h-4 w-4" />
                  {candidate.education}
                  {candidate.graduationYear && ` · ${candidate.graduationYear}`}
                </span>
              )}
              {candidate.verifiedProjects > 0 && (
                <span className="inline-flex items-center gap-fib2 font-semibold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  {candidate.verifiedProjects} verified project
                  {candidate.verifiedProjects === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-x-fib5 pt-fib2">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-fib1 text-sm font-semibold text-brand-600 hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {candidate.bio && (
            <p className="whitespace-pre-wrap border-t border-line pt-fib4 text-sm leading-relaxed text-ink-700">
              {candidate.bio}
            </p>
          )}
        </div>
      </section>

      {candidate.skills.length > 0 && (
        <section className="space-y-fib4 rounded-2xl border border-line bg-white p-fib6 shadow-xs">
          <h2 className="flex items-center gap-fib2 font-bold text-ink-900">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-fib2">
            {candidate.skills.map((skill) => (
              <span
                key={skill.name}
                className="rounded-full bg-brand-50 px-fib4 py-fib1 text-sm font-medium text-brand-700"
              >
                {skill.name}
                {skill.level && (
                  <span className="ml-fib2 text-xs capitalize text-brand-500">
                    {skill.level}
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {candidate.projects.length > 0 && (
        <section className="space-y-fib4">
          <h2 className="flex items-center gap-fib2 font-bold text-ink-900">
            <FolderGit2 className="h-4 w-4 text-brand-600" />
            Projects
          </h2>
          <div className="grid gap-fib4 md:grid-cols-2">
            {candidate.projects.map((project) => (
              <article
                key={project.title}
                className="space-y-fib3 rounded-2xl border border-line bg-white p-fib6 shadow-xs"
              >
                <h3 className="font-semibold text-ink-900">{project.title}</h3>
                <p className="line-clamp-4 text-sm text-ink-600">{project.description}</p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-fib1">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-ink-100 px-fib3 py-0.5 text-xs text-ink-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-fib4 text-sm">
                  {project.repositoryUrl && (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Code ↗
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Live ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
