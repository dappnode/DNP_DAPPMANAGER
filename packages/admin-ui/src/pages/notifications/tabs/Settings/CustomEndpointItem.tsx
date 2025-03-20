import React, { useState } from "react";
import { CustomEndpoint } from "@dappnode/types";
import { EndpointItem } from "./EndpointItem";

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
                treshold: value
              }
            }
          : ep
      )
    );
  };

  return (
    <>
      <EndpointItem
        index={index}
        title={endpoint.name}
        description={endpoint.description}
        endpointEnabled={endpointEnabled}
        handleEndpointToggle={handleEndpointToggle}
        metric={
          endpoint.metric
            ? {
                min: endpoint.metric.min,
                max: endpoint.metric.max,
                unit: endpoint.metric.unit,
                sliderValue: sliderValue
              }
            : undefined
        }
        handleSliderUpdate={handleSliderUpdate}
        handleSliderUpdateComplete={handleSliderUpdateComplete}
        numEndpoints={numEndpoints}
      />
    </>
  );
}
