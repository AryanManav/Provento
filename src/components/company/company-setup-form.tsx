"use client";

import { useActionState, useState } from "react";
import { Building2, CheckCircle2, Circle, LogOut } from "lucide-react";
import { completeCompanySetupAction } from "@/lib/actions/company";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";
import { COMPANY_SETUP_MIN_DESCRIPTION, COMPANY_SIZES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CompanyView } from "@/lib/types/domain";

/** The one-time setup a startup completes before its workspace opens. */
export function CompanySetupForm({ company }: { company: CompanyView | null }) {
  const [state, action] = useActionState(completeCompanySetupAction, null);
  const [fields, setFields] = useState({
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    companySize: company?.companySize ?? "",
    location: company?.location ?? "",
    description: company?.description ?? "",
  });
  const set = (key: keyof typeof fields) => (value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const descriptionLength = fields.description.trim().length;
  const checklist = [
    { label: "Company name", done: fields.name.trim().length >= 2 },
    { label: "Industry", done: fields.industry.trim().length >= 2 },
    { label: "Team size", done: fields.companySize !== "" },
    { label: "Location", done: fields.location.trim().length >= 2 },
    {
      label: `What you build (${Math.min(descriptionLength, COMPANY_SETUP_MIN_DESCRIPTION)}/${COMPANY_SETUP_MIN_DESCRIPTION})`,
      done: descriptionLength >= COMPANY_SETUP_MIN_DESCRIPTION,
    },
  ];
  const done = checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-fib6">
      <div className="space-y-fib3">
        <span className="inline-flex items-center gap-fib2 rounded-md bg-brand-50 px-fib4 py-fib1 text-xs font-semibold text-brand-700">
          <Building2 className="h-3.5 w-3.5" />
          Before you post
        </span>
        <h1 className="text-3xl font-semibold text-ink-900">Set up your company</h1>
        <p className="text-sm text-ink-500">
          Candidates decide whether to do paid work for you from this. Once it&apos;s done
          your workspace opens and you can post projects. Logo, culture and links can be
          added afterwards from your company profile.
        </p>
      </div>

      <div className="grid items-start gap-fib6 lg:grid-cols-3">
        <form
          action={action}
          className="space-y-fib5 rounded-2xl border border-line bg-surface p-fib6 shadow-xs lg:col-span-2"
        >
          {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}

          <div className="space-y-fib3">
            <Label htmlFor="setup-name">Company name</Label>
            <Input
              id="setup-name"
              name="name"
              required
              value={fields.name}
              onChange={(event) => set("name")(event.target.value)}
              placeholder="Acme Labs"
            />
          </div>

          <div className="grid gap-fib5 sm:grid-cols-2">
            <div className="space-y-fib3">
              <Label htmlFor="setup-industry">Industry</Label>
              <Input
                id="setup-industry"
                name="industry"
                required
                value={fields.industry}
                onChange={(event) => set("industry")(event.target.value)}
                placeholder="Fintech, dev tools, logistics…"
              />
            </div>
            <div className="space-y-fib3">
              <Label htmlFor="setup-size">Team size</Label>
              <Select
                id="setup-size"
                name="companySize"
                required
                value={fields.companySize}
                onChange={(event) => set("companySize")(event.target.value)}
                className="normal-case"
              >
                <option value="" disabled>
                  Choose a range
                </option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} people
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-fib3">
              <Label htmlFor="setup-location">Location</Label>
              <Input
                id="setup-location"
                name="location"
                required
                value={fields.location}
                onChange={(event) => set("location")(event.target.value)}
                placeholder="Bengaluru · Remote"
              />
            </div>
            <div className="space-y-fib3">
              <Label htmlFor="setup-website">Website (optional)</Label>
              <Input
                id="setup-website"
                name="website"
                type="url"
                defaultValue={company?.website ?? ""}
                placeholder="https://acme.com"
              />
            </div>
          </div>

          <div className="space-y-fib3">
            <Label htmlFor="setup-description">What do you build?</Label>
            <Textarea
              id="setup-description"
              name="description"
              required
              rows={6}
              maxLength={1500}
              value={fields.description}
              onChange={(event) => set("description")(event.target.value)}
              placeholder="The product, who uses it, and what a junior engineer would work on with you."
            />
            <p
              className={cn(
                "text-xs",
                descriptionLength >= COMPANY_SETUP_MIN_DESCRIPTION
                  ? "text-emerald-700"
                  : "text-ink-400"
              )}
            >
              {descriptionLength} / {COMPANY_SETUP_MIN_DESCRIPTION} characters minimum
            </p>
          </div>

          <div className="flex justify-end border-t border-line pt-fib5">
            <SubmitButton disabled={done < checklist.length}>
              Finish setup and open my workspace
            </SubmitButton>
          </div>
        </form>

        <aside className="space-y-fib5 rounded-2xl border border-line bg-surface p-fib6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Required</h2>
            <span className="text-sm font-semibold text-brand-700">
              {done}/{checklist.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${(done / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-fib3 text-sm">
            {checklist.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "flex items-center gap-fib3",
                  item.done ? "text-emerald-700" : "text-ink-600"
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 text-ink-300" />
                )}
                {item.label}
              </li>
            ))}
          </ul>
          <form
            action="/auth/signout"
            method="post"
            className="border-t border-line pt-fib5"
          >
            <button
              type="submit"
              className="inline-flex items-center gap-fib2 text-xs font-semibold text-ink-500 hover:text-ink-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out and finish later
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
