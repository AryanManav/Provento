import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0a66c2] text-white hover:bg-[#004182] focus-visible:ring-[#0a66c2] font-semibold",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400 font-semibold",
        outline:
          "border border-[#0a66c2] text-[#0a66c2] bg-white hover:bg-[#ebf4fd] focus-visible:ring-[#0a66c2] font-semibold",
        ghost:
          "bg-transparent hover:bg-black/5 text-slate-700 focus-visible:ring-slate-300 font-semibold",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-sm",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
