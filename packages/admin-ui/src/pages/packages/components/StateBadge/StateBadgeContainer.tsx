import React from "react";
import { PackageContainer } from "types";
import { parseContainerState } from "./utils";
import "./stateBadge.scss";

export function StateBadgeContainer({
  container
}: {
  container: PackageContainer;
}) {
  const { variant, state, title } = parseContainerState(container);
  return (
    <span
      className={`state-badge state-badge-container center badge-${variant}`}
      title={title}
    >
      <span className="content">{state}</span>
    </span>
  );
}
