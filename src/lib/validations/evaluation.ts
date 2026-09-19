import { z } from "zod";
import { optionalNote } from "./application";
import {
  HIRE_RECOMMENDATIONS,
  QUALITY_LEVELS,
  RECORDABLE_OUTCOMES,
  SUBMISSION_ATTACHMENTS,
} from "@/lib/constants";

export const submitWorkSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  repositoryUrl: z.string().url("Enter the repository URL for your work"),
  deploymentUrl: z
    .string()
    .url("Enter a valid deployment URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  submissionNotes: z
    .string()
    .min(20, "Explain what you built and any trade-offs, in at least 20 characters"),
});

export type SubmitWorkInput = z.infer<typeof submitWorkSchema>;

export const reviewSubmissionSchema = z
  .object({
    submissionId: z.string().uuid("Invalid submission ID"),
    decision: z.enum(["accepted", "revision_requested", "rejected"], {
      errorMap: () => ({ message: "Unsupported review decision" }),
    }),
    /** Shown to the candidate with the decision. */
    reviewNote: optionalNote(2000),
    /**
     * Only for a rejection: reopen the project to new applicants (true) or
     * close it (false).
     */
    reopenProject: z.enum(["reopen", "close"]).optional(),
  })
  .refine((value) => value.decision !== "revision_requested" || !!value.reviewNote, {
    message: "Tell the candidate what to change when you request a revision",
    path: ["reviewNote"],
  });

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

/**
 * Mirrors the evaluation criteria the company authored on the project. The
 * boolean and count fields are observable facts; the quality fields are coarse
 * bands rather than scores, on purpose.
 */
export const projectFeedbackSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  candidateId: z.string().uuid("Invalid candidate"),
  requirementsCompleted: z.coerce.boolean(),
  technicalQuality: z.enum(QUALITY_LEVELS),
  completeness: z.enum(QUALITY_LEVELS),
  testingQuality: z.enum(QUALITY_LEVELS),
  documentationQuality: z.enum(QUALITY_LEVELS),
  deadlineMet: z.coerce.boolean(),
  revisionsRequired: z.coerce.number().int().min(0).max(20),
  writtenFeedback: z
    .string()
    .min(30, "Give the candidate at least 30 characters of usable feedback"),
  whatWasMissing: z.string().max(1000).optional().nullable(),
  wouldInterviewOrHire: z.enum(HIRE_RECOMMENDATIONS, {
    errorMap: () => ({ message: "Select what you would do next" }),
  }),
});

export type ProjectFeedbackInput = z.infer<typeof projectFeedbackSchema>;

export const projectOutcomeSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  candidateId: z.string().uuid("Invalid candidate"),
  outcome: z.enum(RECORDABLE_OUTCOMES, {
    errorMap: () => ({ message: "Select an outcome" }),
  }),
  reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type ProjectOutcomeInput = z.infer<typeof projectOutcomeSchema>;

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAllowedAttachment(fileName: string): boolean {
  return (SUBMISSION_ATTACHMENTS.extensions as readonly string[]).includes(
    fileExtension(fileName)
  );
}

/** One uploaded file, described by the browser after it reaches storage. */
export const submissionAttachmentSchema = z.object({
  path: z.string().min(1).max(500),
  name: z
    .string()
    .min(1)
    .max(255)
    .refine(isAllowedAttachment, "That file type can't be attached"),
  size: z
    .number()
    .int()
    .positive()
    .max(SUBMISSION_ATTACHMENTS.maxBytes, "A file is too large"),
  type: z.string().max(200).optional().nullable(),
});

export const submissionAttachmentsSchema = z
  .array(submissionAttachmentSchema)
  .max(
    SUBMISSION_ATTACHMENTS.maxFiles,
    `Attach at most ${SUBMISSION_ATTACHMENTS.maxFiles} files`
  );

export type SubmissionAttachmentInput = z.infer<typeof submissionAttachmentSchema>;

export const projectMessageSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  /** Which selected candidate's thread; companies must say, candidates can't. */
  candidateId: z.string().uuid("Invalid candidate").optional(),
  body: z
    .string()
    .trim()
    .min(1, "Write a message first")
    .max(2000, "Keep a message under 2000 characters"),
});
