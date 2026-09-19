import { createClient } from "@/lib/supabase/server";
import type { AccountSettingsView } from "@/lib/types/domain";

const PROVIDER_LABELS: Record<string, string> = {
  email: "Email & password",
  google: "Google",
  github: "GitHub",
};

/**
 * Sign-in methods on the account and anything that currently blocks deleting
 * it. Uses getUser() (a round trip) because identities aren't in the JWT —
 * acceptable on a settings page.
 */
export async function getAccountSettings(): Promise<AccountSettingsView> {
  const supabase = await createClient();
  const [{ data: userData }, { data: blockers }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("account_deletion_blockers"),
  ]);
  const { data: candidate } = userData.user
    ? await supabase
        .from("candidate_profiles")
        .select("id, is_discoverable")
        .eq("user_id", userData.user.id)
        .maybeSingle()
    : { data: null };

  const identities = userData.user?.identities ?? [];
  const providers = Array.from(new Set(identities.map((identity) => identity.provider)));

  return {
    signInMethods: providers.map((provider) => ({
      provider,
      label: PROVIDER_LABELS[provider] ?? provider,
    })),
    hasPassword: providers.includes("email"),
    // Before the migration runs the function is missing; the delete action
    // re-checks on the server either way.
    deletionBlockers: Array.isArray(blockers) ? blockers : [],
    discoverable: candidate ? candidate.is_discoverable !== false : null,
    publicProfilePath: candidate ? `/candidates/${candidate.id}` : null,
  };
}
