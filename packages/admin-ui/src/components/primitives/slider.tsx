import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn("tw:relative tw:flex tw:w-full tw:touch-none tw:select-none tw:items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="tw:relative tw:h-1.5 tw:w-full tw:grow tw:overflow-hidden tw:rounded-full tw:bg-primary/20"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="tw:absolute tw:h-full tw:bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="tw:block tw:size-4 tw:rounded-full tw:border-2 tw:border-primary tw:bg-background tw:shadow tw:ring-offset-background tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-offset-2 tw:disabled:pointer-events-none tw:disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
