import type { ReactNode } from "react";

/**
 * No-op provider kept for test/API compatibility.
 * Tooltips are now plain CSS (see .tip-wrap / .tip), no Radix dependency.
 */
export function TooltipProvider({
  children,
  delayDuration: _delayDuration,
}: {
  children: ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}
