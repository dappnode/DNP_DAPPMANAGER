import React from "react";
import { Endpoint } from "@dappnode/types";
import Switch from "components/Switch";
import Slider from "components/Slider";

interface EndpointItemProps {
  endpoint: Endpoint;
  index: number;
  numEndpoints: number;
  setPkgEndpoints: React.Dispatch<React.SetStateAction<Endpoint[]>>;
}

export function EndpointItem({ endpoint, index, numEndpoints, setPkgEndpoints }: EndpointItemProps) {
  const endpointEnabled = endpoint.enabled;

  const handleEndpointToggle = () => {
    setPkgEndpoints((prevEndpoints) =>
      prevEndpoints.map((ep, i) => (i === index ? { ...ep, enabled: !ep.enabled } : ep))
    );
  };

  // TODO: Parse conditions, and update its value according to the slider
  const handleSliderUpdate = () => {
    // setPkgEndpoints((prevEndpoints) =>
    //   prevEndpoints.map((ep, i) => (i === index ? { ...ep, conditions: [''] } : ep))
    // );
  };

  return (
    <>
      <div key={index} className="endpoint-row">
        <div>
          <strong>{endpoint.definition.title}</strong>
          <div>{endpoint.definition.description}</div>
        </div>
        <Switch checked={endpointEnabled} onToggle={handleEndpointToggle} />
      </div>
      {endpointEnabled && endpoint.metric && (
        <div className="slider-wrapper">
          <Slider
            onChange={handleSliderUpdate}
            // value={endpoint.conditions[0]}
          />
        </div>
      )}
      {index + 1 < numEndpoints && <hr />}
    </>
  );
}
