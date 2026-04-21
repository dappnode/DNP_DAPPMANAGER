import React, { useState } from "react";
import { PackageContainer } from "@dappnode/types";
import { ServiceSelector } from "../../components/ServiceSelector";
import { ContainerIpsCard } from "./ContainerIpsCard";
import { PortMappingCard } from "./PortMappingCard";
import { HttpsMappingsCard } from "./HttpsMappingsCard";

export function NetworkTab({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map((c) => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const container = containers.find((c) => c.serviceName === serviceName);

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {serviceNames.length > 1 && (
        <ServiceSelector serviceName={serviceName} setServiceName={setServiceName} containers={containers} />
      )}
      {container && <ContainerIpsCard container={container} />}
      {container && (
        <PortMappingCard dnpName={container.dnpName} serviceName={container.serviceName} ports={container.ports} />
      )}
      {container && <HttpsMappingsCard dnpName={container.dnpName} serviceName={container.serviceName} />}
    </div>
  );
}
