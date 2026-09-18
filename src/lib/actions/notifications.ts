"use server";

import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { markNotificationsReadSchema } from "@/lib/validations";
import type { ActionResponse } from "@/lib/types/actions";

/**
 * Marks the current user's notifications read. RLS scopes the update to their
 * own rows, and a column grant means `read` is the only field it can change.
 */
export async function markNotificationsReadAction(
  scope: unknown
): Promise<ActionResponse> {
  const user = await requireAuth();
  const parsed = markNotificationsReadSchema.safeParse(scope);
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  const target = parsed.data;
  if ("notificationId" in target) query = query.eq("id", target.notificationId);
  else if ("projectId" in target) query = query.eq("project_id", target.projectId);
  else if ("link" in target) query = query.eq("link_url", target.link);
  else if ("linkPrefix" in target)
    query = query.like("link_url", `${target.linkPrefix}%`);

  const { error } = await query;
  if (error) return { error: "Couldn't update notifications" };
  return { success: true };
}
