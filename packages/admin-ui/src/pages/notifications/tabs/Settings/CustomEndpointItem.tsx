import React, { useState } from "react";
import { CustomEndpoint } from "@dappnode/types";
import Switch from "components/Switch";
import Slider from "components/Slider";

interface CustomEndpointItemProps {
  endpoint: CustomEndpoint;
  index: number;
  numEndpoints: number;
  setCustomEndpoints: React.Dispatch<React.SetStateAction<CustomEndpoint[]>>;
}

export function CustomEndpointItem({ endpoint, index, numEndpoints, setCustomEndpoints }: CustomEndpointItemProps) {
  const endpointEnabled = endpoint.enabled;

  const [sliderValue, setSliderValue] = useState<number>(endpoint.metric?.treshold || 0);

  const handleEndpointToggle = () => {
    setCustomEndpoints((prevEndpoints) =>
      prevEndpoints.map((ep, i) => (i === index ? { ...ep, enabled: !ep.enabled } : ep))
    );
  };

  const handleSliderUpdate = (value: number) => {
    setSliderValue(value);
  };

    const handleSliderUpdateComplete = (value: number) => {
      setCustomEndpoints((prevEndpoints) =>
        prevEndpoints.map((ep, i) =>
          i === index && ep.metric
            ? {
                ...ep,
                metric: {
                  ...ep.metric,
                  treshold: value,
                },
              }
            : ep
        )
      );
    };
    

  return (
    <>
      <div key={index} className="endpoint-row">
        <div>
          <strong>{endpoint.name}</strong>
          <div>{endpoint.description}</div>
        </div>
        <Switch checked={endpointEnabled} onToggle={handleEndpointToggle} />
      </div>
      {endpointEnabled && endpoint.metric && (
        <div className="slider-wrapper">
          <Slider
            value={sliderValue}
            onChange={handleSliderUpdate}
            onChangeComplete={handleSliderUpdateComplete}
            min={endpoint.metric.min}
            max={endpoint.metric.max}
            unit={endpoint.metric.unit}
          />
        </div>
      )}
      {index + 1 < numEndpoints && <hr />}
    </>
  );
}
