import React from "react";
import { InstalledPackageData } from "types";
import { StateBadgeContainer } from "./StateBadgeContainer";
import { allContainersHaveSameVariant, parseContainerState } from "./utils";
import "./stateBadge.scss";

export function StateBadgeDnp({ dnp }: { dnp: InstalledPackageData }) {
  if (dnp.containers.length === 0) {
    return null;
  }

  if (allContainersHaveSameVariant(dnp.containers)) {
    return <StateBadgeContainer container={dnp.containers[0]} />;
  }

  const containers = dnp.containers.sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName)
  );

  return (
    <span className="state-badge state-badge-dnp center">
      {containers.map((container, i) => {
        const { variant, state, title } = parseContainerState(container);
        const firstLetter = typeof state === "string" ? state.slice(0, 1) : "|";

        return (
          <span
            key={i}
            className={`state-badge badge-${variant}`}
            title={title}
          >
            {/* Use a single character to force consistent height */}
            <span className="content">{firstLetter}</span>
          </span>
        );
      })}
    </span>
  );
}
