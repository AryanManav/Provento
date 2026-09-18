import { z } from "zod";
import { SKILL_LEVELS } from "@/lib/constants";

const optionalUrl = (message: string) =>
  z.string().url(message).optional().nullable().or(z.literal(""));

export const candidateProfileSchema = z.object({
  headline: z
    .string()
    .max(160, "Headline cannot exceed 160 characters")
    .optional()
    .nullable(),
  bio: z.string().max(2000, "Bio cannot exceed 2000 characters").optional().nullable(),
  location: z
    .string()
    .max(100, "Location cannot exceed 100 characters")
    .optional()
    .nullable(),
  education: z
    .string()
    .max(150, "Education cannot exceed 150 characters")
    .optional()
    .nullable(),
  graduationYear: z
    .union([z.coerce.number().min(2010).max(2035), z.literal(""), z.null()])
    .optional()
    .transform((value) => (typeof value === "number" ? value : null)),
  resumeUrl: optionalUrl("Please enter a valid URL"),
  githubUrl: optionalUrl("Please enter a valid GitHub URL"),
  portfolioUrl: optionalUrl("Please enter a valid Portfolio URL"),
  linkedinUrl: optionalUrl("Please enter a valid LinkedIn URL"),
  availability: z.string().default("immediate"),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

export const candidateSkillSchema = z.object({
  skillName: z.string().min(2, "Skill name must be at least 2 characters").max(50),
  skillLevel: z.enum(SKILL_LEVELS, {
    errorMap: () => ({
      message: "Skill level must be beginner, intermediate, or advanced",
    }),
  }),
  yearsExperience: z.coerce.number().min(0).max(20).default(0),
});

export type CandidateSkillInput = z.infer<typeof candidateSkillSchema>;

export const candidateSkillUpdateSchema = candidateSkillSchema.extend({
  skillId: z.string().uuid("Invalid skill ID"),
});

export type CandidateSkillUpdateInput = z.infer<typeof candidateSkillUpdateSchema>;

export const candidateProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  technologies: z.string().min(2, "List at least one technology (e.g. React, Node.js)"),
  repositoryUrl: optionalUrl("Please enter a valid repository URL"),
  liveUrl: optionalUrl("Please enter a valid live demo URL"),
});

export type CandidateProjectInput = z.infer<typeof candidateProjectSchema>;

export const candidateProjectUpdateSchema = candidateProjectSchema.extend({
  projectId: z.string().uuid("Invalid project ID"),
});

export type CandidateProjectUpdateInput = z.infer<typeof candidateProjectUpdateSchema>;

export const profileMediaKindSchema = z.enum(["avatar", "banner"], {
  errorMap: () => ({ message: "Unsupported image type" }),
});
