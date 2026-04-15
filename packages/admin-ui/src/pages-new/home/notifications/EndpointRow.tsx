import React, { useCallback, useState } from "react";
import { GatusEndpoint, CustomEndpoint } from "@dappnode/types";
import { Switch } from "components/primitives/switch";
import { Slider } from "components/primitives/slider";
import { Separator } from "components/primitives/separator";
import RenderMarkdown from "components/RenderMarkdown";

/* ── Helpers ───────────────────────────────────────────────────────── */

const OPERATORS = [">=", "<=", "<", ">", "==", "!="] as const;

function parseConditionValue(condition: string): { operator: string | undefined; value: number } {
  const operator = OPERATORS.find((op) => condition.includes(op));
  if (!operator) return { operator: undefined, value: 0 };
  const raw =
    condition
      .split(operator)
      .pop()
      ?.trim() || "0";
  return { operator, value: parseFloat(raw) };
}

function buildUpdatedCondition(condition: string, operator: string | undefined, newValue: number): string {
  if (!operator) return condition;
  return `${condition.split(operator)[0].trim()} ${operator} ${newValue}`;
}

/* ── Shared endpoint row ───────────────────────────────────────────── */

interface EndpointRowProps {
  title: string;
  description: string;
  enabled: boolean;
  metric?: { min: number; max: number; unit: string; sliderValue: number };
  onToggle: () => void;
  onSliderChange?: (value: number) => void;
  onSliderCommit?: (value: number) => void;
}

function EndpointRow({
  title,
  description,
  enabled,
  metric,
  onToggle,
  onSliderChange,
  onSliderCommit
}: EndpointRowProps) {
  return (
    <div className="tw:space-y-3">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
        <div className="tw:space-y-0.5 tw:flex-1 tw:min-w-0">
          <p className="tw:font-medium tw:text-sm">{title}</p>
          <div className="tw:text-xs tw:text-muted-foreground tw:leading-relaxed">
            <RenderMarkdown source={description} />
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && metric && (
        <div className="tw:flex tw:items-center tw:gap-4 tw:pl-1">
          <Slider
            min={metric.min}
            max={metric.max}
            step={1}
            value={[metric.sliderValue]}
            onValueChange={([v]) => onSliderChange?.(v)}
            onValueCommit={([v]) => onSliderCommit?.(v)}
            className="tw:flex-1"
          />
          <span className="tw:text-xs tw:text-muted-foreground tw:tabular-nums tw:w-16 tw:text-right">
            {metric.sliderValue} {metric.unit}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Gatus endpoint item ───────────────────────────────────────────── */

interface GatusEndpointRowProps {
  endpoint: GatusEndpoint;
  index: number;
  setEndpoints: (updater: (prev: GatusEndpoint[]) => GatusEndpoint[]) => void;
}

function GatusEndpointRow({ endpoint, index, setEndpoints }: GatusEndpointRowProps) {
  const { operator, value: conditionValue } = parseConditionValue(endpoint.conditions[0]);
  const [sliderValue, setSliderValue] = useState(conditionValue);

  const handleToggle = useCallback(() => {
    setEndpoints((prev) => prev.map((ep, i) => (i === index ? { ...ep, enabled: !ep.enabled } : ep)));
  }, [index, setEndpoints]);

  const handleSliderCommit = useCallback(
    (value: number) => {
      setSliderValue(value);
      const updatedCondition = buildUpdatedCondition(endpoint.conditions[0], operator, value);
      setEndpoints((prev) =>
        prev.map((ep, i) => (i === index ? { ...ep, conditions: [updatedCondition, ...ep.conditions.slice(1)] } : ep))
      );
    },
    [index, endpoint.conditions, operator, setEndpoints]
  );

  return (
    <EndpointRow
      title={endpoint.definition.title}
      description={endpoint.definition.description}
      enabled={endpoint.enabled}
      metric={
        endpoint.metric
          ? { min: endpoint.metric.min, max: endpoint.metric.max, unit: endpoint.metric.unit, sliderValue }
          : undefined
      }
      onToggle={handleToggle}
      onSliderChange={setSliderValue}
      onSliderCommit={handleSliderCommit}
    />
  );
}

/* ── Custom endpoint item ──────────────────────────────────────────── */

interface CustomEndpointRowProps {
  endpoint: CustomEndpoint;
  index: number;
  setEndpoints: (updater: (prev: CustomEndpoint[]) => CustomEndpoint[]) => void;
}

function CustomEndpointRow({ endpoint, index, setEndpoints }: CustomEndpointRowProps) {
  const [sliderValue, setSliderValue] = useState(endpoint.metric?.treshold || 0);

  const handleToggle = useCallback(() => {
    setEndpoints((prev) => prev.map((ep, i) => (i === index ? { ...ep, enabled: !ep.enabled } : ep)));
  }, [index, setEndpoints]);

  const handleSliderCommit = useCallback(
    (value: number) => {
      setSliderValue(value);
      setEndpoints((prev) =>
        prev.map((ep, i) => (i === index && ep.metric ? { ...ep, metric: { ...ep.metric, treshold: value } } : ep))
      );
    },
    [index, setEndpoints]
  );

  return (
    <EndpointRow
      title={endpoint.name}
      description={endpoint.description}
      enabled={endpoint.enabled}
      metric={
        endpoint.metric
          ? { min: endpoint.metric.min, max: endpoint.metric.max, unit: endpoint.metric.unit, sliderValue }
          : undefined
      }
      onToggle={handleToggle}
      onSliderChange={setSliderValue}
      onSliderCommit={handleSliderCommit}
    />
  );
}

/* ── Exports ───────────────────────────────────────────────────────── */

export { EndpointRow, GatusEndpointRow, CustomEndpointRow, Separator };
