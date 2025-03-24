import React from "react";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./permissions.scss";
import { GatusEndpointItem } from "pages/notifications/tabs/Settings/GatusEndpointItem";
import { CustomEndpointItem } from "pages/notifications/tabs/Settings/CustomEndpointItem";

interface NotificationsProps {
  endpointsGatus: GatusEndpoint[];
  setEndpointsGatus: React.Dispatch<React.SetStateAction<GatusEndpoint[]>>;
  endpointsCustom: CustomEndpoint[];
  setEndpointsCustom: React.Dispatch<React.SetStateAction<CustomEndpoint[]>>;
  goNext: () => void;
  goBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({
  endpointsGatus,
  setEndpointsGatus,
  endpointsCustom,
  setEndpointsCustom,
  goNext,
  goBack
}) => {
  return (
    <Card>
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
      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Accept
        </Button>
      </div>
    </Card>
  );
};
