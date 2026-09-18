"use client";

import { useEffect, useSyncExternalStore } from "react";
import { markNotificationsReadAction } from "@/lib/actions/notifications";
import { NOTIFICATIONS_API_PATH } from "@/lib/constants";
import type { MarkNotificationsReadInput } from "@/lib/validations";
import type { NotificationSummary } from "@/lib/types/domain";

/**
 * One summary shared by the bell and the nav badges, so marking something read
 * clears every badge at once without a full page refresh. Server components
 * pass the first value in; after that it comes from the polling endpoint.
 */
let current: NotificationSummary | null = null;
let latestRequest = 0;
const listeners = new Set<() => void>();

function publish(next: NotificationSummary) {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationSummary(
  initial: NotificationSummary
): NotificationSummary {
  // Seed the store so optimistic updates have something to work from.
  useEffect(() => {
    if (!current) publish(initial);
  }, [initial]);

  return useSyncExternalStore(
    subscribe,
    () => current ?? initial,
    () => initial
  );
}

/** Refetches the summary. Only the newest request's answer is kept. */
export async function refreshNotifications(): Promise<NotificationSummary | null> {
  const request = ++latestRequest;
  try {
    const response = await fetch(NOTIFICATIONS_API_PATH, { cache: "no-store" });
    if (!response.ok) return null;
    const summary = (await response.json()) as NotificationSummary;
    if (request === latestRequest) publish(summary);
    return summary;
  } catch {
    return null;
  }
}

function matches(
  scope: MarkNotificationsReadInput,
  marker: { id: string; projectId: string | null; linkUrl: string | null }
): boolean {
  if ("all" in scope) return true;
  if ("notificationId" in scope) return marker.id === scope.notificationId;
  if ("projectId" in scope) return marker.projectId === scope.projectId;
  if ("link" in scope) return marker.linkUrl === scope.link;
  return marker.linkUrl?.startsWith(scope.linkPrefix) ?? false;
}

/** Clears matching badges immediately, then confirms with the server. */
export async function markNotificationsRead(
  scopes: MarkNotificationsReadInput[]
): Promise<void> {
  if (current) {
    const cleared = new Set(
      current.unread
        .filter((marker) => scopes.some((scope) => matches(scope, marker)))
        .map((marker) => marker.id)
    );
    if (cleared.size > 0) {
      publish({
        unreadCount: Math.max(0, current.unreadCount - cleared.size),
        unread: current.unread.filter((marker) => !cleared.has(marker.id)),
        recent: current.recent.map((item) =>
          cleared.has(item.id) || scopes.some((scope) => matches(scope, item))
            ? { ...item, read: true }
            : item
        ),
      });
    }
  }

  await Promise.all(scopes.map((scope) => markNotificationsReadAction(scope)));
  await refreshNotifications();
}
