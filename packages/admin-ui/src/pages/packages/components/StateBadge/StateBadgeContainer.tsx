import React from "react";
import { parseContainerState, PackageContainerStatus } from "./utils";
import "./stateBadge.scss";

export function StateBadgeContainer({ container }: { container: PackageContainerStatus }) {
  return <StateBadge {...parseContainerState(container)} />;
}

export function StateBadge(props: ReturnType<typeof parseContainerState>) {
  const { variant, state, title } = props;
  return (
    <span className={`state-badge state-badge-container center badge-${variant}`} title={title}>
      <span className="content">{state}</span>
    </span>
  );
}
