import React from "react";
import { Separator } from "components/primitives/separator";
import { SshSection } from "./SshSection";
import { PowerManagementSection } from "./PowerManagementSection";
import { HostPasswordSection } from "./HostPasswordSection";
import { UpdateUpgradeSection } from "./UpdateUpgradeSection";
import { DockerUpgradeSection } from "./DockerUpgradeSection";
import { DiskExpansionSection } from "./DiskExpansionSection";

export function HostTab() {
  return (
    <div className="tw:space-y-6">
      <SshSection />
      <Separator />
      <PowerManagementSection />
      <Separator />
      <HostPasswordSection />
      <Separator />
      <DiskExpansionSection />
      <Separator />
      <UpdateUpgradeSection />
      <Separator />
      <DockerUpgradeSection />
    </div>
  );
}
