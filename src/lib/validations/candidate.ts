import { z } from "zod";

export const candidateProfileUpdateSchema = z.object({
  headline: z.string().max(160, "Headline cannot exceed 160 characters").optional().nullable(),
  bio: z.string().max(2000, "Bio cannot exceed 2000 characters").optional().nullable(),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional().nullable(),
  education: z.string().max(150, "Education cannot exceed 150 characters").optional().nullable(),
  graduationYear: z
    .union([z.coerce.number().min(2010).max(2035), z.literal(""), z.null()])
    .optional()
    .transform((val) => (typeof val === "number" ? val : null)),
  resumeUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .url("Please enter a valid GitHub URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .url("Please enter a valid Portfolio URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  availability: z.string().default("immediate"),
});

export type CandidateProfileUpdateInput = z.infer<typeof candidateProfileUpdateSchema>;

export const candidateSkillSchema = z.object({
  skillName: z.string().min(2, "Skill name must be at least 2 characters").max(50),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Skill level must be beginner, intermediate, or advanced" }),
  }),
  yearsExperience: z.coerce.number().min(0).max(20).default(0),
});

export type CandidateSkillInput = z.infer<typeof candidateSkillSchema>;

export const candidateProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  technologies: z.string().min(2, "List at least one technology (e.g. React, Node.js)"),
  repositoryUrl: z.string().url("Please enter a valid repository URL").optional().nullable().or(z.literal("")),
  liveUrl: z.string().url("Please enter a valid live demo URL").optional().nullable().or(z.literal("")),
});

export type CandidateProjectInput = z.infer<typeof candidateProjectSchema>;
