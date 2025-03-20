import React, { useState } from "react";
import { GatusEndpoint } from "@dappnode/types";
import Switch from "components/Switch";
import Slider from "components/Slider";

interface GatusEndpointItemProps {
  endpoint: GatusEndpoint;
  index: number;
  numEndpoints: number;
  setGatusEndpoints: React.Dispatch<React.SetStateAction<GatusEndpoint[]>>;
}

export function GatusEndpointItem({ endpoint, index, numEndpoints, setGatusEndpoints }: GatusEndpointItemProps) {
  const endpointEnabled = endpoint.enabled;

  const operators = ["<", ">", "==", "!=", ">=", "<="];

  // Extract the operator and number from the condition string from the 1ST CONDITION. Rn, is only supporting 1 slider (from 1st condition) per endpoint
  const conditionString = endpoint.conditions[0];
  const operator = operators.find((op) => conditionString.includes(op));
  const conditionValue = operator
    ? conditionString
        .split(operator)
        .pop()
        ?.trim() || ""
    : "0";

  const [sliderValue, setSliderValue] = useState<number>(parseFloat(conditionValue));

  const handleEndpointToggle = () => {
    setGatusEndpoints((prevEndpoints) =>
      prevEndpoints.map((ep, i) => (i === index ? { ...ep, enabled: !ep.enabled } : ep))
    );
  };

  const handleSliderUpdate = (value: number) => {
    setSliderValue(value);
  };

  const handleSliderUpdateComplete = (value: number) => {
    const updatedCondition = operator
      ? `${endpoint.conditions[0].split(operator)[0].trim()} ${operator} ${value}`
      : endpoint.conditions[0];

    setGatusEndpoints((prevEndpoints) =>
      prevEndpoints.map((ep, i) =>
        i === index
          ? {
              ...ep,
              conditions: [
                updatedCondition, // Update ONLY the first condition
                ...ep.conditions.slice(1)
              ]
            }
          : ep
      )
    );
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
