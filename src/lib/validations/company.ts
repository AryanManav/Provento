import { z } from "zod";
import { COMPANY_SETUP_MIN_DESCRIPTION } from "@/lib/constants";

// Only web links: `javascript:` and `data:` also parse as URLs, and these
// render as clickable links on pages candidates visit.
const optionalUrl = (message: string) =>
  z
    .string()
    .url(message)
    .refine((value) => /^https?:\/\//i.test(value), message)
    .optional()
    .nullable()
    .or(z.literal(""));

export const companyProfileSchema = z.object({
  name: z.string().min(2, "Company name required").max(120),
  website: optionalUrl("Invalid website URL"),
  description: z.string().max(1500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  companySize: z.string().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  logoUrl: optionalUrl("Invalid logo URL"),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

/**
 * The setup step before a company can post: everything candidates need to
 * judge who they'd be working for. Mirrors company_ready_to_post().
 */
export const companySetupSchema = z.object({
  name: z.string().trim().min(2, "Enter your company's name").max(120),
  website: optionalUrl("Enter a full website address, e.g. https://acme.com"),
  industry: z.string().trim().min(2, "Enter your industry").max(100),
  companySize: z.string().trim().min(1, "Choose your team size"),
  location: z.string().trim().min(2, "Enter where you're based").max(100),
  description: z
    .string()
    .trim()
    .min(
      COMPANY_SETUP_MIN_DESCRIPTION,
      `Tell candidates what you build — at least ${COMPANY_SETUP_MIN_DESCRIPTION} characters`
    )
    .max(1500),
});

export const companyCultureSchema = z.object({
  techStack: z.array(z.string().trim().min(1).max(40)).max(30, "Up to 30 technologies"),
  workStyle: z.enum(["remote", "hybrid", "onsite"]).nullable(),
  perks: z.string().trim().max(1500).nullable(),
  hiringProcess: z.string().trim().max(1500).nullable(),
});

export const companyLinksSchema = z.object({
  linkedinUrl: optionalUrl("Enter a full LinkedIn address"),
  githubUrl: optionalUrl("Enter a full GitHub address"),
  careersUrl: optionalUrl("Enter a full careers page address"),
  foundedYear: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().int().min(1900).max(2100).nullable()
  ),
});
