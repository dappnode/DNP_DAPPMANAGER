// React
import React from "react";
import { useState } from "react";

// Components
import Card from "components/Card";
import { ServiceSelector } from "../ServiceSelector";
import { PortsByService } from "./PortsByService";
import { PackageContainer } from "common";

// Styles
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

          <PortsByService
            key={container.serviceName}
            dnpName={container.dnpName}
            serviceName={container.serviceName}
            ports={container.ports}
          />
        </>
      )}
    </Card>
  );
}
