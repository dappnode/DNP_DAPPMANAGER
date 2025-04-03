import SubTitle from "components/SubTitle";
import React from "react";
import { CustomEndpointItem } from "./CustomEndpointItem";
import { GatusEndpointItem } from "./GatusEndpointItem";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./settings.scss";

interface InstallerEndpointsListProps {
  endpointsGatus: GatusEndpoint[];
  setEndpointsGatus: React.Dispatch<React.SetStateAction<GatusEndpoint[]>>;
  endpointsCustom: CustomEndpoint[];
  setEndpointsCustom: React.Dispatch<React.SetStateAction<CustomEndpoint[]>>;
}

export const InstallerEndpointsList: React.FC<InstallerEndpointsListProps> = ({
  endpointsGatus,
  setEndpointsGatus,
  endpointsCustom,
  setEndpointsCustom
}) => {
  return (
    <div className="notifications-settings">
      <SubTitle className="notifications-section-title">Manage notifications</SubTitle>
      <div>Enable, disable and customize notifications individually.</div>
      <div className="endpoint-list-card">
        {endpointsGatus &&
          endpointsGatus.map((endpoint, i) => (
            <GatusEndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={endpointsGatus.length}
              setGatusEndpoints={setEndpointsGatus}
            />
          ))}
        {endpointsCustom &&
          endpointsCustom.map((endpoint, i) => (
            <CustomEndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={endpointsCustom.length}
              setCustomEndpoints={setEndpointsCustom}
            />
          ))}
      </div>
    </div>
  );
};
