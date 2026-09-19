import { StatusBanner } from "@/components/common/status-banner";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homeFor } from "@/lib/constants";
import {
  ArrowRight,
  CheckCircle,
  ClipboardList,
  FileCheck2,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedOutCta } from "@/components/layout/signed-out-cta";
import { SectionHeading } from "@/components/marketing/section-heading";
import { HeroFragments } from "@/components/marketing/hero-fragments";

const TRUST = [
  "Standardized 5–10h projects",
  "100% paid work for candidates",
  "Evidence-based evaluations",
];

const LOOP = [
  {
    icon: ClipboardList,
    title: "Write the brief",
    body: "Requirements, deliverables, and the criteria you will judge against — authored once, reused every time.",
  },
  {
    icon: GitBranch,
    title: "Watch the work happen",
    body: "Incremental commits and clarification questions, not a single opaque submission at the deadline.",
  },
  {
    icon: FileCheck2,
    title: "Evaluate real output",
    body: "Score against your own criteria, with observable facts: revisions needed, deadline met, requirements completed.",
  },
  {
    icon: Wallet,
    title: "Decide with evidence",
    body: "Hire, interview, or pass. The candidate is paid either way, and keeps a verified record of the work.",
  },
];

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full-stack Developer",
  "Software Engineer",
  "QA/Test Engineer",
  "Data Analyst",
  "Data Engineer",
  "AI/ML Engineer",
  "DevOps Engineer",
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  // Signed-in users skip the marketing page and land on their dashboard.
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <div className="pb-fib9">
      {account === "deleted" && (
        <div className="mx-auto max-w-6xl px-fib5 pt-fib5 sm:px-fib6">
          <StatusBanner tone="success">
            Your account has been deleted. Thanks for trying Trialent.
          </StatusBanner>
        </div>
      )}
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-dot-grid mask-radial absolute inset-0" />
        <HeroFragments />

        <div className="relative mx-auto max-w-5xl px-fib6 py-fib9 text-center">
          <span className="inline-flex items-center gap-fib4 rounded-full border border-line bg-white px-fib5 py-fib3 text-xs font-semibold uppercase tracking-wider text-ink-600 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Project-based talent discovery
          </span>

          <h1 className="mt-fib6 text-4xl font-extrabold leading-[1.05] text-ink-950 sm:text-5xl">
            <span className="block text-balance">Try talent through real work</span>
            <span className="block text-ink-400">before you hire.</span>
          </h1>

          <p className="mx-auto mt-fib6 max-w-xl text-base text-ink-500 sm:text-lg">
            Startups evaluate emerging engineers through standardized, paid
            micro-projects. Real evidence before any hiring decision.
          </p>

          <div className="mt-fib7 flex flex-col items-center justify-center gap-fib5 sm:flex-row">
            <SignedOutCta>
              <Link href="/signup?role=company">
                <Button size="lg" className="h-12 w-full px-fib7 text-base sm:w-auto">
                  Hire through paid projects
                </Button>
              </Link>
              <Link href="/signup?role=candidate">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-fib7 text-base sm:w-auto"
                >
                  Prove your skills
                </Button>
              </Link>
            </SignedOutCta>
          </div>

          <div className="mt-fib7 flex flex-wrap items-center justify-center gap-x-fib7 gap-y-fib4 text-xs text-ink-500">
            {TRUST.map((item) => (
              <span key={item} className="flex items-center gap-fib3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- The shift in model */}
      <section className="mx-auto max-w-6xl px-fib6 py-fib9">
        <SectionHeading
          chip="The problem"
          title="Resumes and puzzle rounds"
          trailing="tell you almost nothing"
          subtitle="Traditional hiring guesses. Trialent evaluates genuine code and realistic execution."
        />

        <div className="mt-fib8 grid gap-fib6 md:grid-cols-2">
          <article className="rounded-2xl border border-line bg-ink-50 p-fib7">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
              The traditional model
            </p>
            <h3 className="mt-fib4 text-lg font-bold text-ink-900">
              High risk, built on speculation
            </h3>
            <p className="mt-fib3 text-sm text-ink-500">
              CV → algorithm quiz → behavioural chat → hire and hope
            </p>
            <ul className="mt-fib6 space-y-fib5 text-sm text-ink-600">
              {[
                "Resumes and degrees do not reflect day-to-day coding capability.",
                "Algorithmic puzzles measure memorization, not architecture or debugging.",
                "A mis-hire costs months of salary, onboarding, and team momentum.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-fib4">
                  <span className="mt-fib1 font-bold text-rose-500">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-brand-200 bg-brand-50/60 p-fib7 ring-1 ring-brand-500/10">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
              The Trialent model
            </p>
            <h3 className="mt-fib4 text-lg font-bold text-ink-900">
              Evidence before hiring
            </h3>
            <p className="mt-fib3 text-sm text-ink-600">
              Shortlist → paid realistic project → observe the work → decide
            </p>
            <ul className="mt-fib6 space-y-fib5 text-sm text-ink-700">
              {[
                "See how they write tests, structure schemas, and handle real edge cases.",
                "Candidates are fairly paid for their effort — ₹5,000 for a 5–10 hour sprint.",
                "Every project leaves verified proof for the candidate and clarity for you.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-fib4">
                  <CheckCircle className="mt-fib1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ------------------------------------------------------- The loop, bento */}
      <section className="relative border-y border-line bg-ink-50 py-fib9">
        <div className="bg-line-grid mask-radial absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-6xl px-fib6">
          <SectionHeading
            chip="How it works"
            title="One loop,"
            trailing="from brief to hiring decision"
            subtitle="Four steps. Each one leaves a record that neither side can fake after the fact."
          />

          <div className="mt-fib8 grid gap-fib5 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-2xl border border-line bg-white p-fib6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <p className="mt-fib5 text-xs font-semibold text-ink-400">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-fib2 font-bold text-ink-900">{step.title}</h3>
                  <p className="mt-fib3 text-sm leading-relaxed text-ink-500">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Worked example */}
      <section className="mx-auto max-w-6xl px-fib6 py-fib9">
        <SectionHeading
          chip="A real brief"
          title="What a startup actually posts"
          subtitle="Instead of four rounds of whiteboard interviews, a logistics startup posts this."
        />

        <div className="mt-fib8 overflow-hidden rounded-2xl bg-ink-950 text-white shadow-lg">
          <div className="grid gap-fib7 p-fib7 sm:p-fib8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h3 className="text-xl font-bold tracking-tight">
                Junior backend engineer trial
              </h3>
              <p className="mt-fib5 text-sm leading-relaxed text-ink-400">
                REST API for inventory management, scoped so a capable junior can finish
                it in a weekend without unpaid overtime.
              </p>

              <div className="mt-fib6 space-y-fib4 border-t border-ink-800 pt-fib6 text-sm text-ink-300">
                <p className="font-semibold text-white">Concrete deliverables</p>
                {[
                  "Node.js / PostgreSQL repository with clean schema migrations.",
                  "Token-based authentication and warehouse inventory CRUD endpoints.",
                  "Integration tests covering critical paths, plus setup documentation.",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-fib4">
                    <span className="mt-fib1 text-brand-400">•</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-fib5 lg:col-span-2">
              {[
                ["Scope", "5–10 hours · 5 day window"],
                ["Guaranteed pay", "₹5,000 milestone"],
                ["Outcome", "Hire, interview, or pass"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-ink-800 bg-ink-900 p-fib6"
                >
                  <p className="text-xs font-medium text-ink-400">{label}</p>
                  <p className="mt-fib2 font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Roles */}
      <section className="mx-auto max-w-6xl px-fib6 pb-fib9">
        <SectionHeading
          chip="Coverage"
          title="Standardized evaluation"
          trailing="across core technical roles"
        />

        <div className="mx-auto mt-fib7 flex max-w-3xl flex-wrap items-center justify-center gap-fib4">
          {ROLES.map((role) => (
            <span
              key={role}
              className="rounded-full border border-line bg-white px-fib5 py-fib3 text-sm font-medium text-ink-700 shadow-xs"
            >
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Closing CTA */}
      <section className="mx-auto max-w-6xl px-fib6">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-50 px-fib7 py-fib9 text-center">
          <div className="bg-dot-grid mask-radial absolute inset-0" />
          <div className="relative">
            <ShieldCheck className="mx-auto h-10 w-10 text-brand-600" />
            <h2 className="mx-auto mt-fib6 max-w-2xl text-2xl font-bold text-ink-900 sm:text-3xl">
              Stop guessing.
              <span className="text-ink-400"> Watch them build something real.</span>
            </h2>
            <p className="mx-auto mt-fib5 max-w-lg text-ink-500">
              Post one paid project and see what a candidate actually does with it.
            </p>

            <div className="mt-fib7 flex flex-col items-center justify-center gap-fib5 sm:flex-row">
              <SignedOutCta>
                <Link href="/signup?role=company">
                  <Button size="lg" className="h-12 gap-fib3 px-fib7 text-base">
                    <span>Post an evaluation project</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 gap-fib3 px-fib7 text-base"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>See how it works</span>
                  </Button>
                </Link>
              </SignedOutCta>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
