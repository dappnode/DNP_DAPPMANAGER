import React from "react";
import { useState } from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { PackageContainer } from "@dappnode/types";
import { ServiceSelector } from "../ServiceSelector";
import { PortsByService } from "./PortsByService";
import { HttpsMappings } from "./HttpsMappings";
import "./network.scss";

export function Network({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map((c) => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const container = containers.find((c) => c.serviceName === serviceName);
  return (
    <>
      <Card spacing className="network-editor">
        <ServiceSelector serviceName={serviceName} setServiceName={setServiceName} containers={containers} />
        {container && (
          <div className="container-ips">
            <strong>Container IPs </strong>
            <ul>
              {!container.ip && !container.privateIp ? (
                <li>Container IPs not available</li>
              ) : (
                <>
                  {container.ip && <li>Public IP: {container.ip}</li>}
                  {container.privateIp && <li>Private IP: {container.privateIp}</li>}
                </>
              )}
            </ul>
          </div>
        )}
      </Card>

      {container && (
        <>
          <SubTitle>Public port mapping</SubTitle>
          <Card spacing className="network-editor">
            <PortsByService dnpName={container.dnpName} serviceName={container.serviceName} ports={container.ports} />
          </Card>

          <SubTitle>HTTPs domain mapping</SubTitle>
          <Card spacing className="network-editor">
            <HttpsMappings dnpName={container.dnpName} serviceName={container.serviceName} />
          </Card>
        </>
      )}
    </>
  );
}
