import { PackageContainer } from "common";
import React from "react";
import { InstalledPackageData } from "types";
import "./stateBadge.scss";

type SimpleState = "stopped" | "crashed" | "running";
type BadgeVariant = "danger" | "success" | "secondary";

function parseContainerState(
  container: PackageContainer
): { variant: BadgeVariant; state: SimpleState; title: string } {
  const { state, exitCode } = container;

  switch (state) {
    case "created":
      return { variant: "secondary", state: "stopped", title: "Created" };

    case "paused":
      return { variant: "secondary", state: "stopped", title: "Paused" };

    case "exited":
      // Be conservative, if exitCode could not be parsed assume crashed
      // NO, call container.inspect if state == exited and exitCode == null
      if (exitCode === 0) {
        return { variant: "secondary", state: "stopped", title: "Exited (0)" };
      } else {
        return {
          variant: "danger",
          state: "crashed",
          title: `Exited (${exitCode})`
        };
      }

    case "running":
      return { variant: "success", state: "running", title: "Running" };

    case "restarting":
      return { variant: "success", state: "running", title: "Restarting" };

    case "dead":
      return { variant: "danger", state: "crashed", title: "Dead" };
  }
}

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

export function StateBadgeDnp({ dnp }: { dnp: InstalledPackageData }) {
  if (dnp.containers.length === 0) {
    return null;
  }

  if (
    // Only one container
    dnp.containers.length === 1 ||
    // Every container has the same visual state (variant)
    dnp.containers.every(
      container =>
        parseContainerState(container).variant ===
        parseContainerState(dnp.containers[0]).variant
    )
  ) {
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
