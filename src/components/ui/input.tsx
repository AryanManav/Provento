import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/ui/field-styles";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(fieldBase, "flex h-10 py-2", className)}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
