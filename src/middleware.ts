import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { UserRole } from "@/lib/types/database.types";
import { resolveUserRole } from "@/lib/constants";

export async function middleware(request: NextRequest) {
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

  // If user is authenticated, check role for route isolation and auth page redirects
  if (user) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = resolveUserRole(
      dbUser?.role as UserRole | undefined,
      user.user_metadata?.role
    );

    // Redirect away from login/signup if already logged in
    if (isAuthPage) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (role === "company") {
        return NextResponse.redirect(new URL("/company/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/candidate/dashboard", request.url));
      }
    }

    // Role-based boundary checks
    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (isCompanyRoute && role !== "company" && role !== "admin") {
      return NextResponse.redirect(new URL("/candidate/dashboard", request.url));
    }

    if (isCandidateRoute && role !== "candidate" && role !== "admin") {
      return NextResponse.redirect(new URL("/company/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
