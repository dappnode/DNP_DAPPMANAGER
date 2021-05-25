import React from "react";
import { parseAvahiDaemonState } from "./utils";
import { AvahiStatusType } from "types";
import "./stateBadge.scss";

export function StateBadgeAvahiDaemon({
  avahiStatusType
}: {
  avahiStatusType: AvahiStatusType;
}) {
  const { variant, state, title } = parseAvahiDaemonState(avahiStatusType);
  return (
    <span
      className={`state-badge state-badge-avahi center badge-${variant}`}
      title={title}
    >
      <span className="content">{state}</span>
    </span>
  );
}
