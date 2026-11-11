import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function IconButton({
  label,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { label: string; children: ReactNode }) {
  return (
    <span className="tip-wrap">
      <button
        type="button"
        className={cn("btn btn-ghost btn-icon", className)}
        aria-label={label}
        {...props}
      >
        {children}
      </button>
      <span className="tip" role="tooltip">{label}</span>
    </span>
  );
}
