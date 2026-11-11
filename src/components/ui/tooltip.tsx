import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipContextValue = { label: React.ReactNode };
const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const content = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TooltipContent,
  ) as React.ReactElement<{ children?: React.ReactNode }> | undefined;
  const label = content?.props.children;
  const trigger = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TooltipTrigger,
  );
  return (
    <TooltipContext.Provider value={{ label }}>
      {trigger}
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { label } = React.useContext(TooltipContext) ?? { label: null };
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ "data-tooltip"?: string }>;
    return React.cloneElement(child, {
      "data-tooltip": typeof label === "string" ? label : undefined,
    } as React.Attributes & { "data-tooltip"?: string });
  }
  return (
    <span
      ref={ref}
      className={cn("ui-tooltip-trigger", className)}
      data-tooltip={typeof label === "string" ? label : undefined}
      {...props}
    >
      {children}
    </span>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} role="tooltip" className={cn("ui-tooltip-content", className)} {...props}>
      {children}
    </div>
  ),
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
