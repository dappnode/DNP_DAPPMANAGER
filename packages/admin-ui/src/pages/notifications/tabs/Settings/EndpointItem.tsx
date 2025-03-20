import React from "react";
import Switch from "components/Switch";
import Slider from "components/Slider";

interface EndpointItemProps {
  title: string;
  description: string;
  endpointEnabled: boolean;
  metric: any;
  index: number;
  numEndpoints: number;
  sliderValue: number;
  handleEndpointToggle: () => void;
  handleSliderUpdate: (value: number) => void;
  handleSliderUpdateComplete: (value: number) => void;
}

export function EndpointItem({index, title, description, endpointEnabled, metric, numEndpoints, sliderValue, handleEndpointToggle, handleSliderUpdate, handleSliderUpdateComplete}: EndpointItemProps) {  
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
            value={sliderValue}
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