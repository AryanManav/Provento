import type { CompanyView } from "@/lib/types/domain";

/**
 * What candidates look at before applying, in the order they notice it. Each
 * missing item is one less reason to trust a paid project from an unknown
 * startup.
 */
const PROFILE_FIELDS: { key: keyof CompanyView; label: string }[] = [
  { key: "name", label: "Company name" },
  { key: "logoUrl", label: "Logo" },
  { key: "description", label: "What you build" },
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "companySize", label: "Team size" },
  { key: "location", label: "Location" },
];

export function companyProfileCompleteness(company: CompanyView | null): {
  percent: number;
  missing: string[];
} {
  const missing = PROFILE_FIELDS.filter(({ key }) => {
    const value = company?.[key];
    return typeof value !== "string" || value.trim() === "";
  }).map(({ label }) => label);
  const done = PROFILE_FIELDS.length - missing.length;
  return { percent: Math.round((done / PROFILE_FIELDS.length) * 100), missing };
}
