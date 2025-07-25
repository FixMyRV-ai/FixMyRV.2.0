import { cn } from "@/lib/utils";
import * as React from "react";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "block text-sm font-medium text-foreground mb-2",
        className
      )}
      {...props}
    />
  );
});

Label.displayName = "Label";

export { Label };
