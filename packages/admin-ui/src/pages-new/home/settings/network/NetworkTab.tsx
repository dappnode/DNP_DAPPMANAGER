import React from "react";
import { Separator } from "components/primitives/separator";
import { StaticIpSection } from "./StaticIpSection";
import { PortsSection } from "./PortsSection";

export function NetworkTab() {
  return (
    <div className="tw:space-y-6">
      <StaticIpSection />
      <Separator />
      <PortsSection />
    </div>
  );
}
