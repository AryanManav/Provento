import { z } from "zod";
import { isInternalPath } from "@/lib/utils";

// `%`, `_` and `\` are LIKE wildcards; no route of ours contains them.
const internalPath = z
  .string()
  .max(200)
  .refine(isInternalPath, "Must be an internal path")
  .refine((value) => !/[%_\\]/.test(value), "Invalid path");

/**
 * What to mark as read: one notification, one project, everything linking to a
 * page (`link`) or under a section (`linkPrefix`), or all of them.
 */
export const markNotificationsReadSchema = z.union([
  z.object({ notificationId: z.string().uuid() }),
  z.object({ projectId: z.string().uuid() }),
  z.object({ link: internalPath }),
  z.object({ linkPrefix: internalPath }),
  z.object({ all: z.literal(true) }),
]);

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
