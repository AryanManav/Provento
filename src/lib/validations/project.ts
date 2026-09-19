import { z } from "zod";
import {
  ASSESSMENT_TYPES,
  DEFAULT_CURRENCY,
  EXPERIENCE_LEVELS,
  MAX_ASSESSMENT_HOURS,
  JOB_TYPES,
  MAX_APPLICANTS_LIMIT,
  MAX_HIRE_OPENINGS,
  MAX_OPENINGS,
  PROJECT_CATEGORIES,
  WORK_ARRANGEMENTS,
} from "@/lib/constants";
import type {
  AssessmentType,
  ExperienceLevel,
  JobType,
  ProjectCategory,
  WorkArrangement,
} from "@/lib/types/database.types";
import { optionalNote } from "./application";

export const createProjectSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(150),
    // Only "local" is accepted until the in-app editor exists; the column already
    // allows "in_app" so nothing has to migrate when it ships.
    workMode: z
      .enum(["local"], {
        errorMap: () => ({ message: "That build mode isn't available yet" }),
      })
      .default("local"),
    description: z.string().min(20, "Please provide a clear description"),
    problemStatement: z
      .string()
      .min(30, "Problem statement must clearly describe the business challenge"),
    context: z.string().min(30, "Provide relevant context for the junior candidate"),
    requirements: z
      .array(z.string().min(2))
      .min(1, "At least one requirement is mandatory"),
    deliverables: z
      .array(z.string().min(2))
      .min(1, "At least one deliverable is mandatory"),
    acceptanceCriteria: z
      .array(z.string().min(2))
      .min(1, "At least one acceptance criterion is mandatory"),
    evaluationCriteria: z
      .array(z.string().min(2))
      .min(1, "At least one evaluation criterion is mandatory"),
    expectedHours: z.coerce
      .number()
      .min(2, "Minimum 2 hours")
      .max(40, "Maximum 40 hours for a junior trial project"),
    paymentAmount: z.coerce
      .number()
      .min(1000, "Minimum payment is ₹1,000 to respect candidate labor"),
    currency: z.string().default(DEFAULT_CURRENCY),
    category: z.enum(
      Object.keys(PROJECT_CATEGORIES) as [ProjectCategory, ...ProjectCategory[]],
      { errorMap: () => ({ message: "Choose the project's topic" }) }
    ),
    purpose: z
      .enum(["hire", "build"], {
        errorMap: () => ({ message: "Choose whether you're hiring or only building" }),
      })
      .default("build"),
    openings: z.coerce
      .number()
      .int("Openings must be a whole number")
      .min(1, "At least 1 opening")
      .max(MAX_OPENINGS, `At most ${MAX_OPENINGS} openings`)
      .default(1),
    // Empty means no cap.
    maxApplicants: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number()
        .int("Applicant limit must be a whole number")
        .min(1, "Allow at least 1 applicant")
        .max(MAX_APPLICANTS_LIMIT, `At most ${MAX_APPLICANTS_LIMIT} applicants`)
        .optional()
    ),
    applicationDeadline: z.string().datetime({ message: "Invalid application deadline" }),
    projectDeadline: z.string().datetime({ message: "Invalid project deadline" }),
  })
  .refine((data) => new Date(data.applicationDeadline) < new Date(data.projectDeadline), {
    message: "Application deadline must be before the project deadline",
    path: ["applicationDeadline"],
  })
  .refine((data) => data.purpose === "hire" || data.openings === 1, {
    message: "A build-only project has one candidate",
    path: ["openings"],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * A hire-only posting: a role, not a project — no fee, deliverables or
 * evaluation. Openings (how many to hire) and the application limit (how
 * many may apply) are separate numbers, and the limit can't be below the
 * openings.
 */
export const createHiringSchema = z
  .object({
    title: z.string().min(3, "Give the role a title").max(150),
    category: z.enum(
      Object.keys(PROJECT_CATEGORIES) as [ProjectCategory, ...ProjectCategory[]],
      { errorMap: () => ({ message: "Choose the role's area" }) }
    ),
    jobType: z.enum(Object.keys(JOB_TYPES) as [JobType, ...JobType[]], {
      errorMap: () => ({ message: "Choose the job type" }),
    }),
    workArrangement: z.enum(
      Object.keys(WORK_ARRANGEMENTS) as [WorkArrangement, ...WorkArrangement[]],
      { errorMap: () => ({ message: "Choose remote, hybrid or on-site" }) }
    ),
    jobLocation: z.string().trim().max(120).optional(),
    experienceLevel: z.enum(
      Object.keys(EXPERIENCE_LEVELS) as [ExperienceLevel, ...ExperienceLevel[]],
      { errorMap: () => ({ message: "Choose the experience level" }) }
    ),
    description: z.string().trim().min(20, "Summarise the role in a sentence or two"),
    aboutRole: z.string().trim().min(30, "Describe the role in a little more detail"),
    responsibilities: z
      .array(z.string().min(2))
      .min(1, "List at least one responsibility"),
    requirements: z.array(z.string().min(2)).min(1, "List at least one requirement"),
    niceToHave: z.array(z.string().min(2)).default([]),
    compensation: z.string().trim().max(120).optional(),
    openings: z.coerce
      .number()
      .int("Openings must be a whole number")
      .min(1, "Hire at least 1 person")
      .max(MAX_HIRE_OPENINGS, `At most ${MAX_HIRE_OPENINGS} openings`),
    maxApplicants: z.coerce
      .number()
      .int("The application limit must be a whole number")
      .min(1, "Allow at least 1 application")
      .max(MAX_APPLICANTS_LIMIT, `At most ${MAX_APPLICANTS_LIMIT} applications`),
    applicationDeadline: z.string().datetime({ message: "Invalid application deadline" }),

    // The hiring assessment — required: candidates are hired on this work.
    assessmentTitle: z.string().trim().min(3, "Give the assessment a title").max(150),
    assessmentType: z.enum(
      Object.keys(ASSESSMENT_TYPES) as [AssessmentType, ...AssessmentType[]],
      { errorMap: () => ({ message: "Choose the kind of assessment" }) }
    ),
    assessmentDescription: z
      .string()
      .trim()
      .min(30, "Describe the assessment so candidates know what to build")
      .max(10000),
    assessmentRequirements: z
      .array(z.string().min(2))
      .min(1, "List at least one assessment requirement"),
    deliverables: z
      .array(z.string().min(2))
      .min(1, "List what candidates hand in, e.g. a repository and a README"),
    assessmentTechnologies: z.array(z.string().min(1)).default([]),
    evaluationCriteria: z.array(z.string().min(2)).default([]),
    expectedHours: z.coerce
      .number()
      .int("Estimated time must be whole hours")
      .min(1, "Estimate at least 1 hour")
      .max(
        MAX_ASSESSMENT_HOURS,
        `Keep the assessment to ${MAX_ASSESSMENT_HOURS} hours or less`
      ),
    assessmentDeadline: z.string().datetime({ message: "Invalid assessment deadline" }),
  })
  .refine(
    (data) =>
      new Date(data.assessmentDeadline).getTime() >=
      new Date(data.applicationDeadline).getTime(),
    {
      message: "The assessment deadline can't be before the application deadline",
      path: ["assessmentDeadline"],
    }
  )
  .refine((data) => data.maxApplicants >= data.openings, {
    message: "The application limit must be at least the number of openings",
    path: ["maxApplicants"],
  })
  .refine((data) => new Date(data.applicationDeadline).getTime() > Date.now(), {
    message: "The application deadline must be in the future",
    path: ["applicationDeadline"],
  });

export type CreateHiringInput = z.infer<typeof createHiringSchema>;

export const projectVisibilitySchema = z.object({
  projectId: z.string().uuid("Invalid project"),
  visibility: z.enum(["public", "private"], {
    errorMap: () => ({ message: "Choose public or private" }),
  }),
});

export const withdrawProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project"),
  /** Sent to every applicant with the notification. */
  reason: optionalNote(1000),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project"),
});
