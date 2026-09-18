import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getNotificationSummary } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

/** The signed-in user's notification summary, polled by open tabs. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await getNotificationSummary(user.id);
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}
