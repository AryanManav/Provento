import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOpenProjectBySlug } from "@/lib/data/project";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApplicationForm } from "@/components/candidate/application-form";
import { Badge } from "@/components/ui/badge";
import { WORK_MODES, companyProfilePath } from "@/lib/constants";
import { Avatar } from "@/components/common/avatar";
import { BadgeCheck, Building2, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await getOpenProjectBySlug(slug);
  if (!project) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/projects/${slug}`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
        ← All projects
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              <Link
                href={companyProfilePath(project.companyId)}
                className="font-medium hover:text-brand-600 hover:underline"
              >
                {project.companyName || "Startup"}
              </Link>
              {project.companyLocation ? ` · ${project.companyLocation}` : ""}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">{project.title}</h1>
            <span className="mt-fib4 inline-flex rounded-full bg-brand-50 px-fib5 py-fib2 text-xs font-semibold text-brand-700">
              {WORK_MODES[project.workMode].label}
            </span>
          </div>
          <Badge variant="success">Applications open</Badge>
        </div>

        <p className="text-slate-700 leading-relaxed">{project.description}</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <b>{formatCurrency(project.paymentAmount, project.currency)}</b> paid
            evaluation
          </span>
          <span>{project.expectedHours} hours estimated</span>
          <span>Apply by {formatDate(project.applicationDeadline)}</span>
        </div>
      </section>

      <section className="flex flex-col gap-fib5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row">
        <Avatar
          name={project.companyName || "Startup"}
          src={project.company.logoUrl}
          className="h-14 w-14 rounded-xl text-lg"
        />
        <div className="min-w-0 space-y-fib3">
          <div className="flex flex-wrap items-center gap-fib3">
            <h2 className="text-lg font-bold text-ink-900">
              About {project.companyName || "the startup"}
            </h2>
            {project.company.verified && (
              <span className="inline-flex items-center gap-fib2 rounded-full bg-emerald-50 px-fib4 py-fib1 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-ink-500">
            {[
              project.company.industry,
              project.company.size && `${project.company.size} people`,
              project.companyLocation,
            ]
              .filter(Boolean)
              .join(" · ") || "Early-stage startup"}
          </p>
          {project.company.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {project.company.description}
            </p>
          )}
          <Link
            href={companyProfilePath(project.companyId)}
            className="mr-fib5 inline-flex items-center gap-fib2 text-sm font-semibold text-brand-600 hover:underline"
          >
            <Building2 className="h-4 w-4" />
            Company profile &amp; track record
          </Link>
          {project.company.website && (
            <a
              href={project.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-fib2 text-sm font-semibold text-brand-600 hover:underline"
            >
              <Globe className="h-4 w-4" />
              Visit website
            </a>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-xl font-bold">The challenge</h2>
        <p className="whitespace-pre-wrap text-slate-700">{project.problemStatement}</p>

        <h3 className="font-semibold">Deliverables</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {project.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="font-semibold">Acceptance criteria</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {project.acceptanceCriteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="font-semibold">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <Badge key={skill.name} variant={skill.required ? "default" : "secondary"}>
              {skill.name}
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold mb-4">Apply for this evaluation</h2>
        {user.role === "candidate" ? (
          <ApplicationForm projectId={project.id} />
        ) : (
          <p className="text-sm text-slate-600">
            Only candidate accounts can submit an application.
          </p>
        )}
      </section>
    </div>
  );
}
