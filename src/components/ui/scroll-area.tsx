import * as React from "react";
import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("ui-scroll-area", className)} {...props}>
      <div
        data-radix-scroll-area-viewport=""
        className="h-full w-full rounded-[inherit]"
        style={{ overflow: "auto" }}
      >
        {children}
      </div>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    data-orientation={orientation}
    className={cn(
      "ui-scroll-bar",
      orientation === "vertical" ? "ui-scroll-bar--vertical" : "ui-scroll-bar--horizontal",
      className,
    )}
    {...props}
  >
    <div className="ui-scroll-thumb" />
  </div>
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
