import Link from "next/link";
import { createProjectAction } from "@/lib/actions/company";
import { requireRole } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBanner } from "@/components/common/status-banner";
import { ProjectPurposeFields } from "@/components/company/project-purpose-fields";
import { MAX_APPLICANTS_LIMIT, PROJECT_CATEGORIES, WORK_MODES } from "@/lib/constants";

export default async function CreateProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(["company", "admin"]);
  const { error } = await searchParams;
  const fields = [
    { name: "requirements", label: "Requirements" },
    { name: "deliverables", label: "Deliverables" },
    { name: "acceptanceCriteria", label: "Acceptance criteria" },
    { name: "evaluationCriteria", label: "Evaluation criteria" },
    { name: "skills", label: "Required skills" },
  ];
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/company/projects" className="text-sm text-indigo-600">
          ← Projects
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create paid evaluation project</h1>
      </div>
      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      <form
        action={createProjectAction}
        className="rounded-xl border bg-white p-6 space-y-5"
      >
        <Input name="title" placeholder="Project title" required />
        <div className="space-y-fib2">
          <label htmlFor="category" className="text-sm font-semibold text-ink-800">
            Topic — where it&apos;s listed in Browse
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className="h-10 w-full rounded-lg border border-line bg-white px-fib4 text-sm"
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {(Object.entries(PROJECT_CATEGORIES) as [string, { label: string }][]).map(
              ([value, topic]) => (
                <option key={value} value={value}>
                  {topic.label}
                </option>
              )
            )}
          </select>
        </div>
        <ProjectPurposeFields />
        <fieldset className="space-y-fib4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            How will the candidate build this?
          </legend>
          <div className="grid gap-fib4 sm:grid-cols-2">
            {(
              Object.entries(WORK_MODES) as [
                keyof typeof WORK_MODES,
                (typeof WORK_MODES)[keyof typeof WORK_MODES],
              ][]
            ).map(([value, mode]) => (
              <label
                key={value}
                className={
                  mode.available
                    ? "flex cursor-pointer gap-fib4 rounded-xl border border-line p-fib5 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                    : "flex cursor-not-allowed gap-fib4 rounded-xl border border-dashed border-line p-fib5 opacity-60"
                }
              >
                <input
                  type="radio"
                  name="workMode"
                  value={value}
                  defaultChecked={value === "local"}
                  disabled={!mode.available}
                  className="mt-fib1"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    {mode.label}
                    {!mode.available && (
                      <span className="ml-fib3 rounded-full bg-ink-100 px-fib4 py-fib1 text-xs font-medium text-ink-500">
                        Coming soon
                      </span>
                    )}
                  </span>
                  <span className="mt-fib1 block text-xs text-ink-500">
                    {mode.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <textarea
          name="description"
          rows={3}
          required
          className="w-full rounded-lg border p-3 text-sm"
          placeholder="Short candidate-facing description"
        />
        <textarea
          name="problemStatement"
          rows={4}
          required
          className="w-full rounded-lg border p-3 text-sm"
          placeholder="Problem statement"
        />
        <textarea
          name="context"
          rows={4}
          required
          className="w-full rounded-lg border p-3 text-sm"
          placeholder="Business and engineering context"
        />
        {fields.map(({ name, label }) => (
          <div key={name}>
            <label className="text-sm font-semibold">
              {label} <span className="font-normal text-slate-400">one per line</span>
            </label>
            <textarea
              name={name}
              rows={3}
              required={name !== "skills"}
              className="mt-1 w-full rounded-lg border p-3 text-sm"
            />
          </div>
        ))}
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            name="expectedHours"
            type="number"
            min="2"
            max="40"
            placeholder="Expected hours"
            required
          />
          <Input
            name="paymentAmount"
            type="number"
            min="1000"
            placeholder="Payment amount (INR)"
            required
          />
          <div className="sm:col-span-2">
            <label className="text-sm" htmlFor="max-applicants">
              Applicant limit <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              id="max-applicants"
              name="maxApplicants"
              type="number"
              min="1"
              max={MAX_APPLICANTS_LIMIT}
              placeholder="e.g. 20 — leave empty for no limit"
            />
            <p className="mt-1 text-xs text-slate-400">
              Once this many candidates apply, the project shows as Full and stops taking
              applications. Withdrawn applications free their place.
            </p>
          </div>
          <div>
            <label className="text-sm">Application deadline</label>
            <Input name="applicationDeadline" type="datetime-local" required />
          </div>
          <div>
            <label className="text-sm">Project deadline</label>
            <Input name="projectDeadline" type="datetime-local" required />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Publish project</Button>
        </div>
      </form>
    </div>
  );
}
