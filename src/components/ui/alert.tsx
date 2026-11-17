import * as React from "react";
import { cn } from "../../lib/utils";

type DivProps = React.ComponentProps<"div">;
type AlertVariant = "default" | "destructive";

export const Alert = React.forwardRef<HTMLDivElement, DivProps & { variant?: AlertVariant }>(
  function Alert({ className, variant = "default", ...props }, ref) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn("av-alert", variant === "destructive" && "av-alert--destructive", className)}
        {...props}
      />
    );
  },
);

export const AlertTitle = React.forwardRef<HTMLDivElement, DivProps>(function AlertTitle(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-alert-title", className)} {...props} />;
});

export const AlertDescription = React.forwardRef<HTMLDivElement, DivProps>(function AlertDescription(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn("av-alert-description", className)} {...props} />;
});
