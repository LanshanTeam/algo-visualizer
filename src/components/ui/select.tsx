import * as React from "react";
import { cn } from "../../lib/utils";

type SelectItemData = { value: string; label: string };

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  items: SelectItemData[];
  register: (item: SelectItemData) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("Select components must be used inside <Select>");
  return context;
}

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}) {
  const [items, setItems] = React.useState<SelectItemData[]>([]);
  const register = React.useCallback((item: SelectItemData) => {
    setItems((previous) =>
      previous.some((entry) => entry.value === item.value) ? previous : [...previous, item],
    );
  }, []);
  const context = React.useMemo(
    () => ({ value, onValueChange, items, register }),
    [value, onValueChange, items, register],
  );
  return <SelectContext.Provider value={context}>{children}</SelectContext.Provider>;
}

export function SelectGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

export function SelectValue() {
  return null;
}

export const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  Omit<React.ComponentProps<"select">, "value" | "onChange">
>(function SelectTrigger({ className, children: _children, ...props }, ref) {
  const { value, onValueChange, items } = useSelect();
  return (
    <select
      ref={ref}
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={cn("av-select-trigger", className)}
      {...props}
    >
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
});

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return (
    <div hidden className="av-select-options">
      {children}
    </div>
  );
}

export function SelectLabel({ children, ...props }: React.ComponentProps<"div">) {
  return <div {...props}>{children}</div>;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children?: React.ReactNode;
}) {
  const { register } = useSelect();
  const label =
    React.Children.toArray(children)
      .map((child) =>
        typeof child === "string" || typeof child === "number"
          ? String(child)
          : "",
      )
      .join("") || String(value);
  React.useEffect(() => {
    register({ value, label });
  }, [value, label, register]);
  return null;
}

export function SelectSeparator() {
  return null;
}

export function SelectScrollUpButton() {
  return null;
}

export function SelectScrollDownButton() {
  return null;
}
