import { requireRole } from "@/lib/auth/guards";
import { getCompanyForUser } from "@/lib/data/company";
import { saveCompanyCultureAction } from "@/lib/actions/company";
import { COMPANY_WORK_STYLES } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";

export const dynamic = "force-dynamic";

/** What working at the company is like: stack, work style, perks, hiring process. */
export default async function CompanyCulturePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { saved, error } = await searchParams;
  const company = await getCompanyForUser(user.id);

  return (
    <form
      action={saveCompanyCultureAction}
      className="space-y-fib6 rounded-2xl border border-line bg-white p-fib6 shadow-xs"
    >
      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {saved && <StatusBanner tone="success">Culture and stack saved.</StatusBanner>}

      <div>
        <h2 className="text-lg font-semibold text-ink-900">Culture and stack</h2>
        <p className="text-sm text-ink-500">
          Shown on your public page, so candidates know what they&apos;d work with and
          how.
        </p>
      </div>

      <div className="space-y-fib3">
        <Label htmlFor="tech-stack">Tech stack</Label>
        <Textarea
          id="tech-stack"
          name="techStack"
          rows={3}
          defaultValue={company?.techStack.join(", ") ?? ""}
          placeholder="Next.js, TypeScript, PostgreSQL, AWS"
        />
        <p className="text-xs text-ink-400">Comma-separated or one per line. Up to 30.</p>
      </div>

      <fieldset className="space-y-fib3">
        <legend className="text-sm font-medium text-ink-800">How the team works</legend>
        <div className="flex flex-wrap gap-fib3">
          {(Object.entries(COMPANY_WORK_STYLES) as [string, string][]).map(
            ([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-fib2 rounded-md border border-line px-fib5 py-fib3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
              >
                <input
                  type="radio"
                  name="workStyle"
                  value={value}
                  defaultChecked={company?.workStyle === value}
                  className="sr-only"
                />
                {label}
              </label>
            )
          )}
        </div>
      </fieldset>

      <div className="space-y-fib3">
        <Label htmlFor="perks">Perks and benefits</Label>
        <Textarea
          id="perks"
          name="perks"
          rows={4}
          maxLength={1500}
          defaultValue={company?.perks ?? ""}
          placeholder="Mentorship from senior engineers, flexible hours, learning budget…"
        />
      </div>

      <div className="space-y-fib3">
        <Label htmlFor="hiring-process">Hiring process</Label>
        <Textarea
          id="hiring-process"
          name="hiringProcess"
          rows={4}
          maxLength={1500}
          defaultValue={company?.hiringProcess ?? ""}
          placeholder="Paid Trialent project → 30-minute review call with the team → offer."
        />
        <p className="text-xs text-ink-400">
          Candidates trust a startup more when they know what happens after the project.
        </p>
      </div>

      <div className="flex justify-end border-t border-line pt-fib5">
        <SubmitButton>Save culture and stack</SubmitButton>
      </div>
    </form>
  );
}
