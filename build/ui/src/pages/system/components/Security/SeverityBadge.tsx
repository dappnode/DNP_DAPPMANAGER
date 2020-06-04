import React from "react";
import styled from "styled-components";

export type SeverityLevel = "critical" | "none";

const CriticalSeverity = styled.span`
  background-color: var(--danger-color);
  padding: 3px 4px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  border-radius: 2px;
`;

export default function SecurityBadge({
  severity
}: {
  severity: SeverityLevel;
}) {
  if (severity === "critical")
    return <CriticalSeverity>Address immediately</CriticalSeverity>;
  // Develop other levels as they become necessary
  else return <CriticalSeverity>Address immediately</CriticalSeverity>;
}
