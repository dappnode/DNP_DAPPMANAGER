import React from "react";
import { useState } from "react";
import Card from "components/Card";
import { PackageContainer } from "types";
import { ServiceSelector } from "../ServiceSelector";
import { PortsByService } from "./PortsByService";
import { HttpsMappings } from "./HttpsMappings";
import "./network.scss";

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

      {container && (
        <>
          <div>
            <strong>Container IP: </strong>
            {container.ip || "Not available"}
          </div>

          <div className="subtle-header">HTTPS DOMAIN MAPPING</div>
          <HttpsMappings
            dnpName={container.dnpName}
            serviceName={container.serviceName}
          />

          <hr />

          <div className="subtle-header">PUBLIC PORT MAPPING</div>
          <PortsByService
            dnpName={container.dnpName}
            serviceName={container.serviceName}
            ports={container.ports}
          />
        </>
      )}
    </Card>
  );
}
