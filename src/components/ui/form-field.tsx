"use client";

import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

/** Wires a generated id between the label and the control it renders. */
export function FormField({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-fib3">
      <Label htmlFor={id} className="flex items-center gap-fib3">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children(id)}
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
