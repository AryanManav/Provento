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

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  status: z.enum(REVIEWABLE_APPLICATION_STATUSES, {
    errorMap: () => ({ message: "Unsupported application status" }),
  }),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

export const withdrawApplicationSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
});
