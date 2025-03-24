import React from "react";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./../../../notifications/tabs/Settings/settings.scss";
import { GatusEndpointItem } from "pages/notifications/tabs/Settings/GatusEndpointItem";
import { CustomEndpointItem } from "pages/notifications/tabs/Settings/CustomEndpointItem";
import SubTitle from "components/SubTitle";

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
    <Card className="notifications-settings">
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
      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Accept
        </Button>
      </div>
    </Card>
  );
};
