import type { SupabaseClient } from "@supabase/supabase-js";
import { activityDay } from "@/lib/activity";
import type { CandidateActivityType } from "@/lib/constants";
import type { Database } from "@/lib/types/database.types";

/**
 * Activity rows are unique per (candidate, type, day), so repeated edits within
 * a day cannot inflate the streak. The date is set here, in the activity time
 * zone, rather than left to the database's UTC `CURRENT_DATE`.
 *
 * Lives outside `lib/actions` on purpose: every export of a "use server" module
 * becomes a publicly callable endpoint, and this is an internal helper.
 */
export async function recordActivity(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  activityType: CandidateActivityType
) {
  await supabase.from("candidate_activity").upsert(
    {
      candidate_id: candidateId,
      activity_type: activityType,
      activity_date: activityDay(),
    },
    { onConflict: "candidate_id,activity_type,activity_date", ignoreDuplicates: true }
  );
}
