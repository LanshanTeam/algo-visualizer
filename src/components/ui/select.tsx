import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string;
  setValue: (next: string) => void;
  open: boolean;
  setOpen: (next: boolean) => void;
  labels: Map<string, string>;
};
const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect(component: string): SelectContextValue {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error(`${component} 必须在 Select 内使用`);
  return ctx;
}

/** Read the `children`/`value` props from a React element with runtime narrowing. */
function propOf(node: React.ReactElement, key: "children" | "value"): unknown {
  const props: unknown = node.props;
  if (props && typeof props === "object" && key in props) {
    return (props as Record<string, unknown>)[key];
  }
  return undefined;
}

/** Flatten a React node to its visible text (e.g. `{n}×` → "2×"). */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf(propOf(node, "children") as React.ReactNode);
  return "";
}

/** Collect value→label pairs from SelectItem descendants without mounting a popover. */
function collectLabels(node: React.ReactNode, labels: Map<string, string>): void {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const value = propOf(child, "value");
    if (typeof value === "string") {
      labels.set(value, textOf(propOf(child, "children") as React.ReactNode));
    } else {
      const inner = propOf(child, "children");
      if (inner) collectLabels(inner as React.ReactNode, labels);
    }
  });
}

const Select = ({
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  children: React.ReactNode;
}) => {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const value = valueProp ?? uncontrolled;
  const [open, setOpen] = React.useState(false);
  const labels = React.useMemo(() => {
    const map = new Map<string, string>();
    collectLabels(children, map);
    return map;
  }, [children]);
  const setValue = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setUncontrolled(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [valueProp, onValueChange],
  );
  const ctx = React.useMemo<SelectContextValue>(
    () => ({ value, setValue, open, setOpen, labels }),
    [value, setValue, open, labels],
  );
  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
};

const SelectValue = ({ placeholder }: { placeholder?: string; children?: React.ReactNode }) => {
  const { value, labels } = useSelect("SelectValue");
  const label = labels.get(value);
  return (
    <span className="ui-select-value" data-placeholder={label ? undefined : true}>
      {label ?? placeholder ?? ""}
    </span>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect("SelectTrigger");
    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="none"
        data-state={open ? "open" : "closed"}
        className={cn("ui-select-trigger", "w-full", className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown aria-hidden="true" />
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect("SelectContent");
    React.useEffect(() => {
      if (!open) return;
      const onPointer = (event: PointerEvent) => {
        const target = event.target as Node;
        if (target instanceof Element && target.closest(".ui-select, [role=listbox]")) return;
        setOpen(false);
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      document.addEventListener("pointerdown", onPointer);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", onPointer);
        document.removeEventListener("keydown", onKey);
      };
    }, [open, setOpen]);
    if (!open) return null;
    return (
      <div ref={ref} role="listbox" className={cn("ui-select-content", className)} {...props}>
        {children}
      </div>
    );
  },
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { value: string; disabled?: boolean }
>(({ className, value, children, disabled, ...props }, ref) => {
  const { value: active, setValue } = useSelect("SelectItem");
  const checked = active === value;
  return (
    <div
      ref={ref}
      role="option"
      aria-selected={checked}
      data-state={checked ? "checked" : "unchecked"}
      data-disabled={disabled ? true : undefined}
      className={cn("ui-select-item", className)}
      onClick={() => !disabled && setValue(value)}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectGroup = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("ui-select-group", className)} {...props} />
);
const SelectLabel = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("ui-select-label", className)} {...props} />
);
const SelectSeparator = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("ui-select-separator", className)} {...props} />
);

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
