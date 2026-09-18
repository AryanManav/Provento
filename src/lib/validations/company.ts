import { z } from "zod";

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
