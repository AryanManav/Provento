import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types/database.types";
import { resolveUserRole } from "@/lib/constants";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/**
 * Retrieves the currently authenticated user with their profile from the database.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id, email, full_name, role, avatar_url, email_verified")
    .eq("id", authUser.id)
    .single();

  if (profileError || !userProfile) {
    // Return fallback info from auth metadata if DB record is syncing
    const fallbackRole = resolveUserRole(null, authUser.user_metadata?.role);
    return {
      id: authUser.id,
      email: authUser.email || "",
      fullName:
        authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      role: fallbackRole,
      avatarUrl: authUser.user_metadata?.avatar_url || null,
      emailVerified: !!authUser.email_confirmed_at,
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
}

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
  unauthorizedRedirect: string = "/"
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect(unauthorizedRedirect);
  }
  return user;
}

/**
 * Enforces that the current user is an admin.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole(["admin"], "/");
}

/**
 * Enforces that the current user is a candidate.
 */
export async function requireCandidate(): Promise<CurrentUser> {
  return requireRole(["candidate"], "/");
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
