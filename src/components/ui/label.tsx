import * as React from "react";
import { cn } from "../../lib/utils";

export const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  function Label({ className, ...props }, ref) {
    return <label ref={ref} className={cn("av-label", className)} {...props} />;
  },
);
