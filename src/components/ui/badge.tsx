import * as React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
}

export function badgeVariants({ variant = "default", className }: { variant?: BadgeVariant; className?: string } = {}) {
  return cn("av-badge", `av-badge--${variant}`, className);
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={badgeVariants({ variant, className })} {...props} />;
}
