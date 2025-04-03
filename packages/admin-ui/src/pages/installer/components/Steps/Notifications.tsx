import React from "react";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import { InstallerEndpointsList } from "pages/notifications/tabs/Settings/InstallerEndpointsList";

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
      <InstallerEndpointsList
        endpointsGatus={endpointsGatus}
        setEndpointsGatus={setEndpointsGatus}
        endpointsCustom={endpointsCustom}
        setEndpointsCustom={setEndpointsCustom}
      />

      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Accept
        </Button>
      </div>
    </Card>
  );
};
