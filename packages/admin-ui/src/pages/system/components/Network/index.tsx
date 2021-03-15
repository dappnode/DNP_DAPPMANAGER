import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { HttpsMappings } from "./HttpsMappings";

export function Network() {
  return (
    <>
      <SubTitle>HTTPs Portal</SubTitle>
      <Card spacing className="network-editor">
        <div>
          HTTPs portal allows you to expose services to the external internet
          with a valid TLS/SSL certificate. Only the services that are safe to
          be exposed will show up here.
        </div>
        <HttpsMappings />
      </Card>
    </>
  );
}
