import * as React from "react";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
    min?: number;
    max?: number;
    step?: number;
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (next: number[]) => void;
    disabled?: boolean;
  }
>(
  (
    { className, min = 0, max = 100, step = 1, value: valueProp, defaultValue, onValueChange, disabled, ...props },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? [min]);
    const values = valueProp ?? uncontrolled;
    const current = values[0] ?? min;
    const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;
    const trackRef = React.useRef<HTMLDivElement>(null);

    const commit = React.useCallback(
      (clientX: number) => {
        if (disabled) return;
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const ratio = rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
        const raw = min + ratio * (max - min);
        const next = Math.round(raw / step) * step;
        const clamped = Math.min(max, Math.max(min, next));
        if (valueProp === undefined) setUncontrolled([clamped]);
        onValueChange?.([clamped]);
      },
      [disabled, min, max, step, valueProp, onValueChange],
    );

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
      commit(event.clientX);
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      commit(event.clientX);
    };
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      let next: number | null = null;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - step;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + step;
      if (event.key === "Home") next = min;
      if (event.key === "End") next = max;
      if (next === null) return;
      event.preventDefault();
      const clamped = Math.min(max, Math.max(min, next));
      if (valueProp === undefined) setUncontrolled([clamped]);
      onValueChange?.([clamped]);
    };

    const label = props["aria-label"];
    return (
      <div
        ref={ref}
        className={cn("ui-slider", className)}
        data-disabled={disabled ? true : undefined}
        {...props}
      >
        <div
          ref={trackRef}
          className="ui-slider-track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <div className="ui-slider-range" style={{ width: `${pct}%` }} />
        </div>
        <div
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className="ui-slider-thumb"
          style={{ position: "absolute", left: `calc(${pct}% - 8px)` }}
          onKeyDown={onKeyDown}
        />
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
