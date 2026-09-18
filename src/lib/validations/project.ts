import { z } from "zod";
import { DEFAULT_CURRENCY, MAX_APPLICANTS_LIMIT, MAX_OPENINGS } from "@/lib/constants";
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
    purpose: z
      .enum(["hire", "build"], {
        errorMap: () => ({ message: "Choose whether you're hiring or only building" }),
      })
      .default("hire"),
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
