import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** 原生滚动容器，替代组件库的 ScrollArea。 */
export function ScrollArea({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("scroll-area", className)} {...props}>
      <div data-scroll-viewport className="h-full w-full overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function ScrollBar(_props: { orientation?: "horizontal" | "vertical" }) {
  return null;
}
