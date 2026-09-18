import { z } from "zod";
import { REVIEWABLE_APPLICATION_STATUSES } from "@/lib/constants";

export const createApplicationSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  coverMessage: z
    .string()
    .min(20, "Cover message must be at least 20 characters explaining your approach"),
  relevantExperience: z.string().max(1000).optional().nullable(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/** Optional text becomes null; anything longer than the database allows is refused. */
const optionalNote = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .max(max, `Keep the message under ${max} characters`)
      .nullable()
      .optional()
  );

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  status: z.enum(REVIEWABLE_APPLICATION_STATUSES, {
    errorMap: () => ({ message: "Unsupported application status" }),
  }),
  /** Shown to the candidate with a Selected / Rejected decision. */
  decisionNote: optionalNote(1000),
});

export { optionalNote };

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export const withdrawApplicationSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
});
