import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ProfileChecklistItem } from "@/lib/types/domain";

/** Profile strength, and exactly which items move it. */
export function ProfileStrengthCard({
  value,
  checklist,
}: {
  value: number;
  checklist: ProfileChecklistItem[];
}) {
  const remaining = checklist.filter((item) => !item.done);
  const complete = remaining.length === 0;

  return (
    <section
      aria-labelledby="profile-strength"
      className="rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="profile-strength" className="text-sm font-semibold text-ink-900">
          Profile strength
        </h2>
        <span className="tabular text-sm font-semibold text-ink-900">{value}%</span>
      </div>
      <ProgressBar
        value={value}
        label="Profile strength"
        tone={complete ? "success" : "brand"}
        className="mt-2.5"
      />
      <p className="mt-2 text-xs text-ink-500">
        {complete
          ? "Everything is complete. Startups see a full profile."
          : `${remaining.length} item${remaining.length === 1 ? "" : "s"} remaining`}
      </p>

      <ul className="mt-3 space-y-1.5">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <Check className="h-4 w-4 text-emerald-700" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 text-ink-300" aria-hidden />
            )}
            {item.done ? (
              <span className="text-ink-600">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="font-medium text-ink-900 hover:text-brand-700"
              >
                Add {item.label.toLowerCase()}
              </Link>
            )}
            <span className="sr-only">{item.done ? "(done)" : "(missing)"}</span>
          </li>
        ))}
      </ul>

      <Link href="/candidate/profile" className="mt-4 block">
        <Button variant={complete ? "outline" : "default"} size="sm" className="w-full">
          {complete ? "Edit profile" : "Complete profile"}
        </Button>
      </Link>
    </section>
  );
}
