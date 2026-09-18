import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/constants";

export type OAuthProviderStatus = Record<OAuthProviderId, boolean>;

const ALL_OFF = Object.fromEntries(
  OAUTH_PROVIDERS.map((provider) => [provider.id, false])
) as OAuthProviderStatus;

/**
 * Which social providers are switched on in the Supabase project.
 *
 * signInWithOAuth does not check this itself: it navigates the browser to
 * Supabase, which answers a disabled provider with a raw JSON error page. Asking
 * first lets the buttons render as unavailable instead of stranding the user.
 */
export async function getOAuthProviderStatus(): Promise<OAuthProviderStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return ALL_OFF;

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      next: { revalidate: 60 },
    });
    if (!response.ok) return ALL_OFF;

    const { external } = (await response.json()) as {
      external?: Record<string, boolean>;
    };
    return Object.fromEntries(
      OAUTH_PROVIDERS.map((provider) => [provider.id, external?.[provider.id] === true])
    ) as OAuthProviderStatus;
  } catch {
    return ALL_OFF;
  }
}
