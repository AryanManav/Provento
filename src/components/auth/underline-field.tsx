"use client";

import { useId, useState, type ComponentProps } from "react";
import { Check, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "valid" | "active";

/**
 * Underline field rather than a bordered box: lighter, and it lets the
 * validation state read as a single coloured rule under the input.
 */
export function UnderlineField({
  icon: Icon,
  label,
  state = "idle",
  className,
  ...props
}: {
  icon: LucideIcon;
  label: string;
  state?: State;
} & ComponentProps<"input">) {
  const id = useId();
  const isPassword = props.type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-fib3">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <div
        className={cn(
          "flex items-center gap-fib5 border-b-2 pb-fib4 transition-colors",
          state === "valid" && "border-emerald-500",
          state === "active" && "border-accent-400",
          state === "idle" && "border-ink-200 focus-within:border-brand-600"
        )}
      >
        <Icon className="h-5 w-5 shrink-0 text-ink-400" />

        <input
          id={id}
          {...props}
          type={isPassword && revealed ? "text" : props.type}
          placeholder={label}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400",
            className
          )}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="shrink-0 rounded text-ink-400 transition-colors hover:text-ink-700"
          >
            {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        ) : (
          state === "valid" && (
            <Check className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
          )
        )}
      </div>
    </div>
  );
}
