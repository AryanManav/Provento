import { z } from "zod";

/** Who to follow: exactly one company or one candidate. */
export const followTargetSchema = z.union([
  z.object({ companyId: z.string().uuid() }),
  z.object({ candidateId: z.string().uuid() }),
]);

export type FollowTarget = z.infer<typeof followTargetSchema>;
