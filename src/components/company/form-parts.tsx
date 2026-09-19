import type { ReactNode } from "react";
import { fieldBase } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

export const inputClass = cn(fieldBase, "h-10");
export const selectClass = cn(fieldBase, "h-10");
export const textareaClass = cn(fieldBase, "py-2.5 leading-relaxed");

/** A labelled field for the server-rendered posting forms. */
export function Field({
  id,
  label,
  hint,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-400">optional</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** A titled group of fields inside a posting form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
