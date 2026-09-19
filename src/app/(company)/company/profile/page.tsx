import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Circle,
  Globe,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getCompanyDashboardStats, getCompanyForUser } from "@/lib/data/company";
import { saveCompanyProfileAction } from "@/lib/actions/company";
import { companyProfileCompleteness } from "@/lib/company";
import { COMPANY_SIZES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";
import { StatCard } from "@/components/common/stat-card";
import { CompanyLogoEditor } from "@/components/company/company-logo-editor";

export const dynamic = "force-dynamic";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const params = await searchParams;
  const company = await getCompanyForUser(user.id);
  const stats = company ? await getCompanyDashboardStats(company.id) : null;
  const completeness = companyProfileCompleteness(company);

  const meta = [
    company?.industry && { icon: Building2, text: company.industry },
    company?.companySize && { icon: Users, text: `${company.companySize} people` },
    company?.location && { icon: MapPin, text: company.location },
  ].filter(Boolean) as { icon: typeof Building2; text: string }[];

  return (
    <div className="space-y-fib6 pb-fib8">
      {params.error && <StatusBanner tone="error">{params.error}</StatusBanner>}
      {params.saved && <StatusBanner tone="success">Company profile saved.</StatusBanner>}

      {/* Preview: roughly what a candidate sees */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-dot-grid" />
        <div className="px-fib6 pb-fib6">
          <div className="-mt-12 flex flex-col gap-fib5 sm:flex-row sm:items-end sm:justify-between">
            <CompanyLogoEditor
              userId={user.id}
              name={company?.name ?? ""}
              logoUrl={company?.logoUrl ?? null}
              editable={Boolean(company)}
            />
            <span className="self-start rounded-full bg-ink-100 px-fib5 py-fib2 text-xs font-semibold text-ink-600 sm:self-auto">
              Preview · how candidates see you
            </span>
          </div>

          <div className="mt-fib5 space-y-fib3">
            <div className="flex flex-wrap items-center gap-fib3">
              <h2 className="text-xl font-bold text-ink-900">
                {company?.name || "Your company name"}
              </h2>
              {company?.verified && (
                <span className="inline-flex items-center gap-fib2 rounded-full bg-emerald-50 px-fib4 py-fib1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            {meta.length > 0 && (
              <div className="flex flex-wrap gap-x-fib5 gap-y-fib2 text-sm text-ink-500">
                {meta.map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-fib2">
                    <Icon className="h-4 w-4 text-ink-400" />
                    {text}
                  </span>
                ))}
              </div>
            )}

            {company?.website && (
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
              {company?.description ||
                "Tell candidates what you build and who they'd work with."}
            </p>
            {!company && (
              <p className="text-xs text-ink-400">
                Save the profile below to add a logo.
              </p>
            )}
          </div>
        </div>
      </section>

      {stats && (
        <div className="grid grid-cols-1 gap-fib5 sm:grid-cols-3">
          <StatCard
            label="Projects posted"
            value={stats.totalProjects}
            hint={`${stats.activeProjects} accepting applications`}
            icon={BriefcaseBusiness}
          />
          <StatCard
            label="Applicants received"
            value={stats.applicants}
            hint={`${stats.awaitingReview} awaiting your review`}
            icon={Users}
          />
          <StatCard
            label="Hires made"
            value={stats.hires}
            hint="From project evaluations"
            icon={Trophy}
            tone="positive"
          />
        </div>
      )}

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <form
          action={saveCompanyProfileAction}
          className="space-y-fib6 rounded-2xl border border-line bg-white p-fib6 shadow-xs lg:col-span-2"
        >
          <div>
            <h2 className="text-lg font-bold text-ink-900">Details</h2>
            <p className="text-sm text-ink-500">Shown on every project you post.</p>
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

        <aside className="space-y-fib5 rounded-2xl border border-line bg-white p-fib6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Profile strength</h2>
            <span className="text-sm font-bold text-brand-600">
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
              className="font-semibold text-brand-600 hover:underline"
            >
              Post a paid project →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
