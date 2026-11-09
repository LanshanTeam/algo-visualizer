import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

export function Badge({ className, variant: _variant, ...props }: BadgeProps) {
  return <span className={cn("badge", className)} {...props} />;
}
