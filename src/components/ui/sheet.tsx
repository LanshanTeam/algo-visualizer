import * as React from "react";
import { cn } from "../../lib/utils";

type SheetContextValue = { open?: boolean; onOpenChange?: (open: boolean) => void };
const SheetContext = React.createContext<SheetContextValue>({});

export function Sheet({ children, open, onOpenChange }: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild = false, children, onClick, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext);
  const handler = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) onOpenChange?.(true);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: unknown }>, { onClick: handler });
  }
  return <button type="button" onClick={handler} {...props}>{children}</button>;
}

export function SheetClose({ children, ...props }: React.ComponentProps<"button">) {
  const { onOpenChange } = React.useContext(SheetContext);
  return <button type="button" onClick={() => onOpenChange?.(false)} {...props}>{children}</button>;
}

export function SheetPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SheetOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("av-sheet-overlay", className)} {...props} />;
}

export function SheetContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (open === false) return null;
  return (
    <div className="av-sheet-layer" role="dialog" aria-modal="true">
      <div className="av-sheet-overlay" onClick={() => onOpenChange?.(false)} />
      <div className={cn("av-sheet-panel", className)} {...props}>{children}</div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("av-sheet-header", className)} {...props} />;
}
export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("av-sheet-footer", className)} {...props} />;
}
export const SheetTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SheetTitle({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sheet-title", className)} {...props} />;
  },
);
export const SheetDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SheetDescription({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sheet-description", className)} {...props} />;
  },
);
