import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types/database.types";
import { dashboardFor, resolveUserRole } from "@/lib/constants";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/**
 * The signed-in user with their profile, or null.
 *
 * Wrapped in `cache` so the layout, navbar and page share one lookup per
 * request. `getClaims()` verifies the session JWT locally against the project's
 * published signing keys (ES256), so it needs no round trip to Supabase Auth —
 * unlike `getUser()`. The trade-off: a revoked session stays valid until its
 * JWT expires (1 h by default). Role and profile still come from the database.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (authError || !claims?.sub) {
    return null;
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id, email, full_name, role, avatar_url, email_verified")
    .eq("id", claims.sub)
    .single();

  if (profileError || !userProfile) {
    // Return fallback info from the token if the DB record is still syncing
    const metadata = claims.user_metadata ?? {};
    const email = claims.email ?? "";
    return {
      id: claims.sub,
      email,
      fullName: metadata.full_name || email.split("@")[0] || "User",
      role: resolveUserRole(null, metadata.role),
      avatarUrl: metadata.avatar_url || null,
      emailVerified: metadata.email_verified === true,
    };
  }

  return {
    id: userProfile.id,
    email: userProfile.email,
    fullName: userProfile.full_name,
    role: userProfile.role,
    avatarUrl: userProfile.avatar_url,
    emailVerified: userProfile.email_verified,
  };
});

/**
 * Enforces that a user is authenticated. Redirects to /login if not.
 */
export async function requireAuth(redirectTo: string = "/login"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Enforces that a user possesses one of the allowed roles.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  unauthorizedRedirect?: string
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    // Default: send people to their own dashboard rather than the home page.
    redirect(unauthorizedRedirect ?? dashboardFor(user.role));
  }
  return user;
}

/**
 * Enforces that the current user is an admin.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole(["admin"]);
}

/**
 * Enforces that the current user is a candidate.
 */
export async function requireCandidate(): Promise<CurrentUser> {
  return requireRole(["candidate"]);
}

/**
 * Enforces that the current user belongs to the specified company or is an admin.
 */
export async function requireCompanyMember(companyId: string) {
  const user = await requireAuth();
  if (user.role === "admin") {
    return { user, isOwner: true, role: "admin" };
  }

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("company_members")
    .select("id, role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .single();

  if (error || !member) {
    redirect("/company/dashboard");
  }

  return {
    user,
    isOwner: member.role === "owner",
    role: member.role,
  };
}
