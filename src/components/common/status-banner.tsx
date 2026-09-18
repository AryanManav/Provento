import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

/**
 * Feedback for the plain server-action forms, which post without JS and so
 * carry their result back in the query string.
 */
export function StatusBanner({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border p-3 text-sm", TONES[tone], className)}
    >
      {children}
    </p>
  );
}
