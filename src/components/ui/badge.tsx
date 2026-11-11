import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "ui-badge--default",
  secondary: "ui-badge--secondary",
  destructive: "ui-badge--destructive",
  outline: "ui-badge--outline",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn("ui-badge", variantClass[variant], className)} {...props} />;
}

export { Badge };
