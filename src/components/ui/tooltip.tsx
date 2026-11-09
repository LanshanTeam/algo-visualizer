import type { ReactNode } from "react";

/**
 * 轻量的可访问名称容器。视觉提示由触发元素自身的 title 提供，
 * 这里只保留 Provider 接口，避免把 Radix 带进页面。
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
