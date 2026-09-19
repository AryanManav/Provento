import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyForUser } from "@/lib/data/company";
import { saveCompanyProfileAction } from "@/lib/actions/company";
import { companyProfileCompleteness } from "@/lib/company";
import { COMPANY_SIZES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";
import { CompanyLogoEditor } from "@/components/company/company-logo-editor";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const params = await searchParams;
  const company = await getCompanyForUser(user.id);
  const completeness = companyProfileCompleteness(company);

  return (
    <div className="space-y-6">
      {params.error && <StatusBanner tone="error">{params.error}</StatusBanner>}
      {params.saved && <StatusBanner tone="success">Company profile saved.</StatusBanner>}

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <form
          action={saveCompanyProfileAction}
          className="space-y-5 rounded-xl border border-line bg-surface p-5 lg:col-span-2"
        >
          <div>
            <h2 className="text-base font-semibold text-ink-900">Basics</h2>
            <p className="text-sm text-ink-500">
              The top of your public page, and shown on every project you post.
            </p>
          </div>

          <div className="space-y-fib3">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              name="name"
              defaultValue={company?.name || ""}
              placeholder="Acme Labs"
              required
              minLength={2}
              maxLength={120}
            />
          </div>

          <div className="grid gap-fib5 sm:grid-cols-2">
            <div className="space-y-fib3">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                name="website"
                type="url"
                defaultValue={company?.website || ""}
                placeholder="https://acme.com"
              />
            </div>
            <div className="space-y-fib3">
              <Label htmlFor="company-location">Location</Label>
              <Input
                id="company-location"
                name="location"
                defaultValue={company?.location || ""}
                placeholder="Bengaluru · Remote"
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid gap-fib5 sm:grid-cols-2">
            <div className="space-y-fib3">
              <Label htmlFor="company-industry">Industry</Label>
              <Input
                id="company-industry"
                name="industry"
                defaultValue={company?.industry || ""}
                placeholder="Fintech, dev tools, logistics…"
                maxLength={100}
              />
            </div>
            <div className="space-y-fib3">
              <Label htmlFor="company-size">Team size</Label>
              <Select
                id="company-size"
                name="companySize"
                defaultValue={company?.companySize || ""}
                className="normal-case"
              >
                <option value="">Select a range</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} people
                  </option>
                ))}
                {/* Keep a free-text value saved before the dropdown existed. */}
                {company?.companySize &&
                  !(COMPANY_SIZES as readonly string[]).includes(company.companySize) && (
                    <option value={company.companySize}>{company.companySize}</option>
                  )}
              </Select>
            </div>
          </div>

          <div className="space-y-fib3">
            <Label htmlFor="company-description">What do you build?</Label>
            <Textarea
              id="company-description"
              name="description"
              defaultValue={company?.description || ""}
              rows={6}
              maxLength={1500}
              placeholder="The product, who uses it, and what a junior engineer would work on with you."
            />
            <p className="text-xs text-ink-400">Up to 1,500 characters.</p>
          </div>

          <div className="flex justify-end border-t border-line pt-fib5">
            <SubmitButton>
              {company ? "Save changes" : "Create company profile"}
            </SubmitButton>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink-900">Logo</h2>
            <p className="mt-0.5 text-xs text-ink-500">Square, PNG or JPG, up to 2 MB.</p>
            <div className="mt-4">
              <CompanyLogoEditor
                userId={user.id}
                name={company?.name ?? ""}
                logoUrl={company?.logoUrl ?? null}
                editable={Boolean(company)}
              />
            </div>
            {!company && (
              <p className="mt-3 text-xs text-ink-400">
                Save the basics first to add a logo.
              </p>
            )}
          </section>
          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Profile strength</h2>
              <span className="text-sm font-semibold text-brand-700">
                {completeness.percent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {completeness.missing.length === 0 ? (
              <p className="flex items-center gap-fib3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Complete — candidates have everything they need.
              </p>
            ) : (
              <ul className="space-y-fib3 text-sm">
                {completeness.missing.map((item) => (
                  <li key={item} className="flex items-center gap-fib3 text-ink-600">
                    <Circle className="h-4 w-4 text-ink-300" />
                    Add {item.toLowerCase()}
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line pt-fib5 text-sm text-ink-500">
              Ready to hire?{" "}
              <Link
                href="/company/projects/create"
                className="font-semibold text-brand-700 hover:underline"
              >
                Post a paid project →
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
