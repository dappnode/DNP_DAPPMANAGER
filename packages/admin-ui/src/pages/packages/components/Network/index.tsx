import React from "react";
import { PackageContainer } from "common";
import { useState } from "react";
import Card from "components/Card";
import { ServiceSelector } from "../ServiceSelector";
import { PortsByService } from "./PortsByService";
import "./network.scss";
import { IpsByService } from "./IpsByService";

export function Network({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map(c => c.serviceName).sort();
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const container = containers.find(c => c.serviceName === serviceName);
  return (
    <Card spacing className="network-editor">
      <ServiceSelector
        serviceName={serviceName}
        setServiceName={setServiceName}
        containers={containers}
      />
      {container && <IpsByService ip={container.ip} />}

      {container && (
        <PortsByService
          key={container.serviceName}
          dnpName={container.dnpName}
          serviceName={container.serviceName}
          ports={container.ports}
        />
      )}
    </Card>
  );
}
