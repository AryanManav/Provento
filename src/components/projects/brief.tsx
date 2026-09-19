import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One titled part of a project brief. Used on the public brief and the workspace. */
export function BriefSection({
  id,
  title,
  icon: Icon,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        "scroll-mt-20 border-t border-line pt-6 first:border-t-0 first:pt-0",
        className
      )}
    >
      <h2
        id={id ? `${id}-title` : undefined}
        className="flex items-center gap-2 text-base font-semibold text-ink-900"
      >
        {Icon && <Icon className="h-4 w-4 text-ink-400" aria-hidden />}
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A checklist-style list for requirements, deliverables and criteria. */
export function BriefList({
  items,
  numbered = false,
}: {
  items: string[];
  numbered?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-400">None listed.</p>;
  }
  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className="flex items-start gap-2.5 text-sm text-ink-700"
        >
          {numbered ? (
            <span className="tabular mt-px w-5 shrink-0 font-mono text-xs text-ink-400">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          )}
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Tech stack chips; required skills are emphasised. */
export function StackList({ skills }: { skills: { name: string; required: boolean }[] }) {
  if (skills.length === 0) return <p className="text-sm text-ink-400">Not specified.</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li
          key={skill.name}
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-xs",
            skill.required
              ? "border-ink-300 bg-white text-ink-800"
              : "border-line bg-ink-50 text-ink-500"
          )}
        >
          {skill.name}
          {!skill.required && <span className="sr-only"> (nice to have)</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * How every Trialent evaluation is recorded — the same on every project, so a
 * candidate knows the shape of the decision before they apply.
 */
export const EVALUATION_DIMENSIONS = [
  "Technical quality",
  "Completeness",
  "Testing",
  "Documentation",
];

export const EVALUATION_FACTS = [
  "All requirements completed",
  "Delivered by the deadline",
  "Revisions needed",
];
