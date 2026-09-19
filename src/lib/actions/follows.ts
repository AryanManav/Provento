"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { followTargetSchema } from "@/lib/validations";
import type { ActionResponse } from "@/lib/types/actions";

/**
 * Follow or unfollow a company or candidate. RLS pins the follower to the
 * signed-in user and refuses following your own candidate profile.
 */
export async function setFollowAction(
  target: unknown,
  follow: boolean
): Promise<ActionResponse> {
  const user = await requireAuth();
  const parsed = followTargetSchema.safeParse(target);
  if (!parsed.success) return { error: "Invalid profile" };

  const target_ = parsed.data;
  const supabase = await createClient();

  if (follow) {
    const { error } = await supabase
      .from("follows")
      .insert(
        "companyId" in target_
          ? { follower_id: user.id, company_id: target_.companyId }
          : { follower_id: user.id, candidate_id: target_.candidateId }
      );
    // Already following is fine (unique index).
    if (error && error.code !== "23505") {
      return { error: "Couldn't follow. Please try again." };
    }
  } else {
    let query = supabase.from("follows").delete().eq("follower_id", user.id);
    query =
      "companyId" in target_
        ? query.eq("company_id", target_.companyId)
        : query.eq("candidate_id", target_.candidateId);
    const { error } = await query;
    if (error) return { error: "Couldn't unfollow. Please try again." };
  }

  revalidatePath("/search");
  return { success: true };
}

/** Candidates choose whether they appear in search and have a public profile. */
export async function setDiscoverableAction(
  discoverable: boolean
): Promise<ActionResponse> {
  const user = await requireAuth();
  if (user.role !== "candidate") return { error: "Only candidates have this setting" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_profiles")
    .update({ is_discoverable: discoverable === true })
    .eq("user_id", user.id);
  if (error) return { error: "Couldn't save. Please try again." };

  revalidatePath("/candidate/settings");
  return { success: true };
}
