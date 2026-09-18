"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/components/notifications/notification-store";
import type { MarkNotificationsReadInput } from "@/lib/validations";

/**
 * Drop on a page to mark what it shows as seen. The page keeps its highlights
 * for this visit; badges elsewhere clear straight away.
 */
export function MarkNotificationsRead({
  scopes,
}: {
  scopes: MarkNotificationsReadInput[];
}) {
  const key = JSON.stringify(scopes);

  useEffect(() => {
    void markNotificationsRead(JSON.parse(key) as MarkNotificationsReadInput[]);
  }, [key]);

  return null;
}
