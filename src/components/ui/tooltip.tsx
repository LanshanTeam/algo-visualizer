import * as React from "react";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children?: React.ReactNode }) {
  return <span className="av-tip">{children}</span>;
}

export function TooltipTrigger({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      ...(props as object),
      className: cn("av-tip-anchor", className, child.props.className),
    });
  }
  return (
    <span className={cn("av-tip-anchor", className)} {...props}>
      {children}
    </span>
  );
}

export function TooltipContent({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span role="tooltip" className={cn("av-tip-bubble", className)} {...props}>
      {children}
    </span>
  );
}
