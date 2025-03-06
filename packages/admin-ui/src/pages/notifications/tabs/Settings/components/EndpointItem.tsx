import React, { useState }  from "react";
import { Endpoint } from "../Settings";
import Switch from "components/Switch";
import Slider from "components/Slider";

export function EndpointItem({ endpoint, index, numEndpoints }: { endpoint: Endpoint; index: number; numEndpoints: number }) {
    const [endpointEnabled, setEndpointEnabled] = useState(endpoint.enabled);
  
    const handleEndpointToggle = () => {
      // TODO: update "notifications.yaml" file
      setEndpointEnabled(!endpointEnabled);
    };
  
    return (
      <>
        <div key={index} className="endpoint-row">
          <div>
            <strong>{endpoint.name}</strong>
            <div>{endpoint.description}</div>
          </div>
          <Switch
            checked={endpointEnabled}
            onToggle={() => {
              handleEndpointToggle();
            }}
          />
        </div>
        {endpointEnabled && endpoint.metric && (
          <div className="slider-wrapper">
            <Slider />
          </div>
        )}
        {index + 1 < numEndpoints && <hr />}
      </>
    );
  }