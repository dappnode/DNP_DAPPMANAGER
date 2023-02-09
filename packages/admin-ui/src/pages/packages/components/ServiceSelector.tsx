import React from "react";
import Select from "components/Select";
import { PackageContainer } from "@dappnode/common";

export function ServiceSelector({
  serviceName,
  setServiceName,
  containers
}: {
  serviceName: string;
  setServiceName: (serviceName: string) => void;
  containers: PackageContainer[];
}) {
  // services should already be sorted from the DAPPMANAGER, `calls/packagesGet.ts`
  const serviceNames = containers.map(c => c.serviceName);

  if (serviceNames.length <= 1) return null;

  return (
    <div>
      <Select
        value={serviceName}
        onValueChange={setServiceName}
        options={serviceNames}
        prepend="Service"
      />
    </div>
  );
}
