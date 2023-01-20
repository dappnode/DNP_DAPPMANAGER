import React from "react";
import { InstalledPackageData } from "@dappnode/common";
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

  return (
    <span className="state-badge state-badge-dnp center">
      {dnp.containers.map(container => {
        const { variant, title } = parseContainerState(container);

        return (
          <span
            key={container.serviceName}
            className={`state-badge badge-${variant}`}
            title={title}
          >
            {/* Use a single character to force consistent height */}
            <span className="content">|</span>
          </span>
        );
      })}
    </span>
  );
}
