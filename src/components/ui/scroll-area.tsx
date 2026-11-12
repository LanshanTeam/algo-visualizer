import * as React from "react";
import { cn } from "../../lib/utils";

export const ScrollArea = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function ScrollArea({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-scroll", className)} {...props} />;
  },
);

/** Native scrolling already renders its own scrollbars. */
export function ScrollBar() {
  return null;
}
