import * as React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn("av-btn", `av-btn--${variant}`, size !== "default" && `av-btn--${size}`, className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", asChild = false, children, type, ...props },
  ref,
) {
  const classes = buttonVariants({ variant, size, className });
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, { className: cn(classes, child.props.className) });
  }
  return (
    <button ref={ref} type={type ?? "button"} className={classes} {...props}>
      {children}
    </button>
  );
});
