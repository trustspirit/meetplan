import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "flex w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2.5 text-base",
      "placeholder:text-text-subtle",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-[invalid=true]:border-danger",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
