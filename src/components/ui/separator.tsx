import * as React from "react";
import { cn } from "../../lib/utils";

export const Separator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
}>(function Separator({ className, orientation = "horizontal", ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      data-orientation={orientation}
      className={cn("av-separator", className)}
      {...props}
    />
  );
});
