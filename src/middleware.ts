import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { UserRole } from "@/lib/types/database.types";
import { dashboardFor, resolveUserRole } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  // Supabase falls back to the Site URL (the home page) when an OAuth
  // redirect_to isn't on the project's allow list, leaving `?code=` on "/"
  // where nothing exchanges it — the user lands home, signed out. Hand the
  // code to the callback so sign-in still completes.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.search = request.nextUrl.search;
    return NextResponse.redirect(callback);
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Static assets and internal next requests pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return supabaseResponse;
  }

  // 1. Protected route prefixes
  const isCandidateRoute = pathname.startsWith("/candidate");
  const isCompanyRoute = pathname.startsWith("/company");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // If no authenticated user, redirect protected routes to login
  if (!user && (isCandidateRoute || isCompanyRoute || isAdminRoute)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed-in users don't need the login or signup pages. This is the only
  // place middleware reads the role: route-level role checks live in each
  // layout's requireRole, which runs anyway and redirects to the right
  // dashboard, so querying here on every navigation only added latency.
  if (user && isAuthPage) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = resolveUserRole(
      dbUser?.role as UserRole | undefined,
      user.userMetadata.role
    );
    return NextResponse.redirect(new URL(dashboardFor(role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
