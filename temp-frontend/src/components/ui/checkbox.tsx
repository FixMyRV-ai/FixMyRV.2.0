import { cn } from "@/lib/utils";
import * as React from "react";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input type="checkbox" className={cn("h-4 w-4 rounded-md border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} ref={ref} />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };





