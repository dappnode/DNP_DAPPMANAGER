import React from "react";
import Switch from "components/Switch";
import Slider from "components/Slider";

interface EndpointItemProps {
  title: string;
  description: string;
  endpointEnabled: boolean;
  metric?: { min: number; max: number; unit: string; sliderValue: number };
  index: number;
  numEndpoints: number;
  handleEndpointToggle: () => void;
  handleSliderUpdate: (value: number) => void;
  handleSliderUpdateComplete: (value: number) => void;
}

export function EndpointItem({
  index,
  title,
  description,
  endpointEnabled,
  metric,
  numEndpoints,
  handleEndpointToggle,
  handleSliderUpdate,
  handleSliderUpdateComplete
}: EndpointItemProps) {
  return (
    <>
      <div key={index} className="endpoint-row">
        <div>
          <strong>{title}</strong>
          <div>{description}</div>
        </div>
        <Switch checked={endpointEnabled} onToggle={handleEndpointToggle} />
      </div>
      {endpointEnabled && metric && (
        <div className="slider-wrapper">
          <Slider
            value={metric.sliderValue}
            onChange={handleSliderUpdate}
            onChangeComplete={handleSliderUpdateComplete}
            min={metric.min}
            max={metric.max}
            unit={metric.unit}
          />
        </div>
      )}
      {index + 1 < numEndpoints && <hr />}
    </>
  );
}
