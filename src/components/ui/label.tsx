import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-ink-500",
        className
      )}
      {...props}
    />
  );
}

export { Label };
