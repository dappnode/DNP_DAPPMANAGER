import React from "react";
import { InstalledPackageData } from "@dappnode/common";
import {
  allContainersHaveSameVariant,
  BadgeVariant,
  parseContainerState,
  SimpleState
} from "./utils";
import "./stateBadge.scss";

/**
 * Renders a state badge color legend only if necessary
 */
export function StateBadgeLegend({ dnps }: { dnps: InstalledPackageData[] }) {
  const states = new Map<
    string,
    { variant: BadgeVariant; state: SimpleState }
  >();

  // Find out if a legend is needed, and for what colors
  for (const dnp of dnps) {
    if (allContainersHaveSameVariant(dnp.containers)) {
      // Ignore
    } else {
      for (const container of dnp.containers) {
        const { variant, state } = parseContainerState(container);
        states.set(state, { variant, state });
      }
    }
  }

  if (states.size === 0) {
    return null;
  }

  return (
    <div className="state-badge-legend">
      {Array.from(states.values())
        .sort((a, b) => a.state.localeCompare(b.state))
        .map(({ variant, state }) => (
          <span key={state} className="state-badge-legend-item">
            <span className={`state-badge badge-${variant}`}></span>
            <span className="legend-label">{state}</span>
          </span>
        ))}
    </div>
  );
}
