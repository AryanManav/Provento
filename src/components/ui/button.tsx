import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product controls, not marketing: compact, 6px radius, medium weight.
 *
 * The primary action is monochrome, not blue: the inverse of the page
 * (charcoal on light, near-white on dark) with a hairline border and a soft
 * top highlight, so it reads as a raised control. One per view; everything
 * else steps down to `outline` (a quiet raised surface) or `ghost`. Colour is
 * for outcomes only — `destructive` stays a subtle red outline until hovered.
 */

/** The primary look, shared with links styled as buttons. */
export const PRIMARY_BUTTON =
  "border border-inverse bg-inverse bg-[linear-gradient(to_bottom,rgb(255_255_255/0.12),rgb(255_255_255/0))] text-inverse-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16)] hover:bg-inverse/90 active:bg-inverse/80 dark:bg-[linear-gradient(to_bottom,rgb(255_255_255/0),rgb(0_0_0/0.08))] dark:shadow-[inset_0_-1px_0_rgb(0_0_0/0.14),0_1px_2px_rgb(0_0_0/0.4)]";
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: PRIMARY_BUTTON,
        secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-300",
        outline:
          "border border-line bg-surface text-ink-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.05)] hover:border-line-strong hover:bg-ink-50 active:bg-ink-100 dark:bg-raised dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] dark:hover:bg-ink-100",
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200",
        destructive:
          "border border-line bg-ink-50 text-rose-700 shadow-xs hover:border-rose-600 hover:bg-rose-600 hover:text-white focus-visible:ring-rose-500/50",
        success:
          "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-emerald-500/50",
        link: "h-auto px-0 text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner, disables the button and announces the busy state. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
