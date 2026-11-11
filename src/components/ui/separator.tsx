import * as React from "react";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    role="none"
    data-orientation={orientation}
    className={cn(
      "ui-separator",
      orientation === "horizontal" ? "ui-separator--horizontal" : "ui-separator--vertical",
      className,
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
