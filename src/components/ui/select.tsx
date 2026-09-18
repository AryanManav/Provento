import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/ui/field-styles";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      className={cn(fieldBase, "h-10 capitalize", className)}
      ref={ref}
      {...props}
    />
  )
);
Select.displayName = "Select";

export { Select };
