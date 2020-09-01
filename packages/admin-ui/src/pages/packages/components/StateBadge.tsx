import React from "react";
import { InstalledPackageData, ContainerState } from "types";

export function getWorstState(dnp: InstalledPackageData): ContainerState {
  const states = new Set<ContainerState>();
  for (const container of dnp.containers) {
    states.add(container.state);
  }

  return states.has("exited")
    ? "exited"
    : states.has("running")
    ? "running"
    : ("" as ContainerState);
}

export function StateBadge({ state }: { state: ContainerState }) {
  const styleColor =
    state === "running"
      ? "success"
      : state === "exited"
      ? "danger"
      : "secondary";
  return (
    <span
      className={`stateBadge center badge-${styleColor}`}
      style={{ opacity: 0.85 }}
    >
      <span className="content">{state}</span>
    </span>
  );
}
