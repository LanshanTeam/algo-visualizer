import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantClass: Record<Variant, string> = {
  default: "ui-button--default",
  destructive: "ui-button--destructive",
  outline: "ui-button--outline",
  secondary: "ui-button--secondary",
  ghost: "ui-button--ghost",
  link: "ui-button--link",
};
const sizeClass: Record<Size, string> = {
  default: "",
  sm: "ui-button--sm",
  lg: "ui-button--lg",
  icon: "ui-button--icon",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const cls = cn("ui-button", variantClass[variant], sizeClass[size], className);
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>;
      const { children: _children, ...rest } = props;
      return React.cloneElement(child, {
        ...rest,
        ref,
        className: cn(cls, child.props.className),
      } as React.Attributes & { className?: string });
    }
    return <button className={cls} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button };
