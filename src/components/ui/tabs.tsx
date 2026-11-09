import * as React from "react";
import { cn } from "../../lib/utils";

type TabsContextValue = {
  active: string | undefined;
  setActive: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside <Tabs>");
  return context;
}

type TabsProps = React.ComponentProps<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  const setActive = React.useCallback((next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }, [value, onValueChange]);
  const context = React.useMemo(() => ({ active, setActive }), [active, setActive]);
  return (
    <TabsContext.Provider value={context}>
      <div className={cn("av-tabs", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function TabsList({ className, ...props }, ref) {
    return <div ref={ref} role="tablist" className={cn("av-tabs-list", className)} {...props} />;
  },
);

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { value: string }
>(function TabsTrigger({ className, value, onClick, ...props }, ref) {
  const { active, setActive } = useTabs();
  const selected = active === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      className={cn("av-tabs-trigger", selected && "is-active", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setActive(value);
      }}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { value: string }
>(function TabsContent({ className, value, children, ...props }, ref) {
  const { active } = useTabs();
  if (active !== value) return null;
  return (
    <div ref={ref} role="tabpanel" data-state="active" className={cn("av-tabs-content", className)} {...props}>
      {children}
    </div>
  );
});
