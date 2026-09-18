"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pending state for plain `<form action={serverAction}>` posts, which have no
 * client state of their own to disable the button with.
 */
export function SubmitButton({
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}
