import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/constants";
import { isInternalPath } from "@/lib/utils";
import type { NotificationSummary, NotificationView } from "@/lib/types/domain";

interface RawNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  project_id: string | null;
  read: boolean;
  created_at: string;
}

interface RawUnread {
  id: string;
  type: string;
  project_id: string | null;
  link_url: string | null;
}

const RECENT_LIMIT = 15;
/** Enough for any real backlog; badges read "99+" long before this matters. */
const UNREAD_LIMIT = 500;

const EMPTY_SUMMARY: NotificationSummary = { unreadCount: 0, recent: [], unread: [] };

function toType(value: string): NotificationType | "other" {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value)
    ? (value as NotificationType)
    : "other";
}

function toView(row: RawNotification): NotificationView {
  return {
    id: row.id,
    type: toType(row.type),
    title: row.title,
    message: row.message,
    linkUrl: isInternalPath(row.link_url) ? row.link_url : null,
    projectId: row.project_id,
    read: row.read,
    createdAt: row.created_at,
  };
}

/**
 * The signed-in user's notification summary. RLS limits rows to their own.
 * Cached per request because the navbar, the role nav and the page all ask.
 */
export const getNotificationSummary = cache(
  async (userId: string): Promise<NotificationSummary> => {
    const supabase = await createClient();
    const [recentResult, unreadResult] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, message, link_url, project_id, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from("notifications")
        .select("id, type, project_id, link_url", { count: "exact" })
        .eq("user_id", userId)
        .eq("read", false)
        .limit(UNREAD_LIMIT),
    ]);

    // Before the notifications migration runs the column is missing; show no
    // alerts rather than break every signed-in page.
    if (recentResult.error || unreadResult.error) return EMPTY_SUMMARY;

    const unread = (unreadResult.data ?? []) as unknown as RawUnread[];
    return {
      unreadCount: unreadResult.count ?? unread.length,
      recent: ((recentResult.data ?? []) as unknown as RawNotification[]).map(toView),
      unread: unread.map((row) => ({
        id: row.id,
        type: toType(row.type),
        projectId: row.project_id,
        linkUrl: isInternalPath(row.link_url) ? row.link_url : null,
      })),
    };
  }
);

/** Unread notifications, newest first, for a dashboard "what changed" panel. */
export async function getUnreadNotifications(
  userId: string,
  limit = 6
): Promise<NotificationView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, link_url, project_id, read, created_at")
    .eq("user_id", userId)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as unknown as RawNotification[]).map(toView);
}
