import React, { useEffect } from "react";
import { useState } from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { PackageContainer } from "@dappnode/types";
import { ServiceSelector } from "../ServiceSelector";
import { PortsByService } from "./PortsByService";
import { HttpsMappings } from "./HttpsMappings";
import "./network.scss";
import { api } from "api";
import LinkDocs from "components/LinkDocs";
import { docsUrl } from "params";

export function Network({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map(c => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const container = containers.find(c => c.serviceName === serviceName);
  const [alisases, setAliases] = useState([]);
  useEffect(() => {
    if (container) {
      async function getContainerAliases(): Promise<void> {
        setAliases(await api.getContainerAliases(container!.containerId));
      }
      getContainerAliases();
    }

  }, [container]);
  
  return (
    <>
      <Card spacing className="network-editor">
        <ServiceSelector
          serviceName={serviceName}
          setServiceName={setServiceName}
          containers={containers}
        />
        {container && (
          <div>
            <strong>Container IP: </strong>
            {container.ip || "Not available"}
            {alisases && (
              <>
                <br />
                <br />
                <b>Aliases: </b>
                <ul>
                  {alisases.map(alias => (
                    <li>{alias}</li>
                  ))}
                </ul>
              </>
            )}
         
            {/* TODO: include docu "Network tab" url when done */}
            <LinkDocs href={docsUrl.main}>
          Learn more about Network tab in our Documentation
        </LinkDocs>
          </div>
        )}
      

      {container && (
        <>
          <SubTitle>Public port mapping</SubTitle>
          <div  className="network-editor">
            <PortsByService
              dnpName={container.dnpName}
              serviceName={container.serviceName}
              ports={container.ports}
            />
          </div>

          <SubTitle>HTTPs domain mapping</SubTitle>
          <div  className="network-editor">
            <HttpsMappings
              dnpName={container.dnpName}
              serviceName={container.serviceName}
            />
          </div>
        </>
      )}
      </Card>
    </>
  );
}
