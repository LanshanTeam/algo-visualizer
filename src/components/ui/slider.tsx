import * as React from "react";
import { cn } from "../../lib/utils";

type SliderProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
};

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, value, defaultValue, onValueChange, min = 0, max = 100, ...props },
  ref,
) {
  const current = value?.[0] ?? defaultValue?.[0] ?? Number(min);
  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      value={current}
      className={cn("av-slider", className)}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      {...props}
    />
  );
});
