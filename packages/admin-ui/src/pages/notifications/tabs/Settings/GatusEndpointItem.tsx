import React, { useState } from "react";
import { GatusEndpoint } from "@dappnode/types";
import { EndpointItem } from "./EndpointItem";

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
      <EndpointItem
        index={index}
        title={endpoint.definition.title}
        description={endpoint.definition.description}
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
