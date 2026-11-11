import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

/** 带可见 tooltip 的可访问图标按钮；不依赖组件库。 */
export function IconButton({
  label,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("btn btn-icon", className)}
      {...props}
    >
      {children}
    </button>
  );
}
