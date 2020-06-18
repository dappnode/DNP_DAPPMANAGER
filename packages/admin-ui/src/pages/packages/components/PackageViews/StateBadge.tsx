import React from "react";
import { ContainerState } from "types";

export default function StateBadge({ state }: { state: ContainerState }) {
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
