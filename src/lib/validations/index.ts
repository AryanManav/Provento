import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["candidate", "company"], {
    errorMap: () => ({ message: "Please select either Candidate or Company" }),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const candidateProfileSchema = z.object({
  headline: z.string().max(120, "Headline too long").optional().nullable(),
  bio: z.string().max(1000, "Bio too long").optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  education: z.string().max(150).optional().nullable(),
  graduationYear: z.coerce.number().int().min(2015).max(2035).optional().nullable(),
  resumeUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  githubUrl: z.string().url("Invalid GitHub URL").optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid Portfolio URL").optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable().or(z.literal("")),
  availability: z.string().default("immediate"),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

export const companyProfileSchema = z.object({
  name: z.string().min(2, "Company name required").max(120),
  website: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  description: z.string().max(1500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  companySize: z.string().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export const createProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z.string().min(20, "Please provide a clear description"),
  problemStatement: z.string().min(30, "Problem statement must clearly describe the business challenge"),
  context: z.string().min(30, "Provide relevant context for the junior candidate"),
  requirements: z.array(z.string().min(2)).min(1, "At least one requirement is mandatory"),
  deliverables: z.array(z.string().min(2)).min(1, "At least one deliverable is mandatory"),
  acceptanceCriteria: z.array(z.string().min(2)).min(1, "At least one acceptance criterion is mandatory"),
  evaluationCriteria: z.array(z.string().min(2)).min(1, "At least one evaluation criterion is mandatory"),
  expectedHours: z.coerce.number().min(2, "Minimum 2 hours").max(40, "Maximum 40 hours for a junior trial project"),
  paymentAmount: z.coerce.number().min(1000, "Minimum payment is ₹1,000 to respect candidate labor"),
  currency: z.string().default("INR"),
  applicationDeadline: z.string().datetime({ message: "Invalid application deadline" }),
  projectDeadline: z.string().datetime({ message: "Invalid project deadline" }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createApplicationSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  coverMessage: z.string().min(20, "Cover message must be at least 20 characters explaining your approach"),
  relevantExperience: z.string().max(1000).optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
