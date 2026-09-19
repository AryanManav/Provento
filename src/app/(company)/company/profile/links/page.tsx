import { requireRole } from "@/lib/auth/guards";
import { getCompanyForUser } from "@/lib/data/company";
import { saveCompanyLinksAction } from "@/lib/actions/company";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";

export const dynamic = "force-dynamic";

/** Where candidates can check the company for themselves. */
export default async function CompanyLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const { saved, error } = await searchParams;
  const company = await getCompanyForUser(user.id);

  return (
    <form
      action={saveCompanyLinksAction}
      className="space-y-fib6 rounded-2xl border border-line bg-white p-fib6 shadow-xs"
    >
      {error && <StatusBanner tone="error">{error}</StatusBanner>}
      {saved && <StatusBanner tone="success">Links saved.</StatusBanner>}

      <div>
        <h2 className="text-lg font-semibold text-ink-900">Links</h2>
        <p className="text-sm text-ink-500">
          Real links help candidates check you&apos;re a genuine company. Your website is
          on the Overview tab.
        </p>
      </div>

      <div className="grid gap-fib5 sm:grid-cols-2">
        <div className="space-y-fib3">
          <Label htmlFor="linkedin">LinkedIn page</Label>
          <Input
            id="linkedin"
            name="linkedinUrl"
            type="url"
            defaultValue={company?.linkedinUrl ?? ""}
            placeholder="https://linkedin.com/company/acme"
          />
        </div>
        <div className="space-y-fib3">
          <Label htmlFor="github">GitHub organisation</Label>
          <Input
            id="github"
            name="githubUrl"
            type="url"
            defaultValue={company?.githubUrl ?? ""}
            placeholder="https://github.com/acme"
          />
        </div>
        <div className="space-y-fib3">
          <Label htmlFor="careers">Careers page</Label>
          <Input
            id="careers"
            name="careersUrl"
            type="url"
            defaultValue={company?.careersUrl ?? ""}
            placeholder="https://acme.com/careers"
          />
        </div>
        <div className="space-y-fib3">
          <Label htmlFor="founded">Founded</Label>
          <Input
            id="founded"
            name="foundedYear"
            type="number"
            min={1900}
            max={2100}
            defaultValue={company?.foundedYear ?? ""}
            placeholder="2024"
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-fib5">
        <SubmitButton>Save links</SubmitButton>
      </div>
    </form>
  );
}
