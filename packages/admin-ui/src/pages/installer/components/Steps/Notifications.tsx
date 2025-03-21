import React from "react";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./permissions.scss";
import { ManagePackageNotifications } from "pages/notifications/tabs/Settings/ManagePackageNotifications";

interface NotificationsProps {
  dnpNotificationEndpoints:
    | {
        endpoints: GatusEndpoint[];
        customEndpoints: CustomEndpoint[];
        isCore: boolean;
      }
    | undefined;
  goNext: () => void;
  goBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ dnpNotificationEndpoints, goNext, goBack }) => {
  return (
    <Card>
      <ManagePackageNotifications
        dnpName="Enable notifications"
        isCore={dnpNotificationEndpoints?.isCore || false}
        gatusEndpoints={dnpNotificationEndpoints?.endpoints || []}
        customEndpoints={dnpNotificationEndpoints?.customEndpoints || []}
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
