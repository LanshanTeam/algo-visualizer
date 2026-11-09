import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (next: string) => void;
};
const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`${component} 必须在 Tabs 内使用`);
  return ctx;
}

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (next: string) => void;
  }
>(({ defaultValue, value: valueProp, onValueChange, className, children, ...props }, ref) => {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = valueProp ?? internal;
  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );
  const ctx = React.useMemo(() => ({ value, setValue }), [value, setValue]);
  return (
    <TabsContext.Provider value={ctx}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      data-orientation="horizontal"
      className={cn("ui-tabs-list", className)}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { value: string }
>(({ className, value, ...props }, ref) => {
  const { value: active, setValue } = useTabs("TabsTrigger");
  const isActive = active === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      data-state={isActive ? "active" : "inactive"}
      aria-selected={isActive}
      className={cn("ui-tabs-trigger", className)}
      onClick={() => setValue(value)}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { value: active } = useTabs("TabsContent");
  if (active !== value) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state="active"
      className={cn("ui-tabs-content", "mt-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
