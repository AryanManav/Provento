import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303, not the default 307: a 307 makes the browser repeat the POST against
  // /login, which only answers GET (405 "This page isn't working").
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
