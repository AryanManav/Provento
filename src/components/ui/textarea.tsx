import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/ui/field-styles";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(fieldBase, "py-2 leading-relaxed", className)}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
