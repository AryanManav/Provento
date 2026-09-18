import type { UnreadMarker } from "@/lib/types/domain";

/**
 * Pure helpers over the unread markers, shared by the server-rendered pages and
 * the client-side badges so both count the same way.
 */

/** Unread notifications whose link lives under `prefix`, e.g. "/candidate/trials". */
export function countUnreadUnder(unread: UnreadMarker[], prefix: string): number {
  return unread.filter(
    (marker) =>
      marker.linkUrl !== null &&
      (marker.linkUrl === prefix || marker.linkUrl.startsWith(`${prefix}/`))
  ).length;
}

/** Unread count per project, for highlighting project cards. */
export function unreadByProject(unread: UnreadMarker[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { projectId } of unread) {
    if (projectId) counts[projectId] = (counts[projectId] ?? 0) + 1;
  }
  return counts;
}
