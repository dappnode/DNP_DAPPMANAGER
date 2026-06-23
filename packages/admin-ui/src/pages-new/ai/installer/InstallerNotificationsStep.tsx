import React from "react";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import { InstallerEndpointsList } from "pages/notifications/tabs/Settings/InstallerEndpointsList";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { ArrowLeft } from "lucide-react";

interface InstallerNotificationsStepProps {
  endpointsGatus: GatusEndpoint[];
  setEndpointsGatus: React.Dispatch<React.SetStateAction<GatusEndpoint[]>>;
  endpointsCustom: CustomEndpoint[];
  setEndpointsCustom: React.Dispatch<React.SetStateAction<CustomEndpoint[]>>;
  goNext: () => void;
  goBack: () => void;
}

/**
 * Notifications step — allows the user to configure notification
 * endpoints for the package being installed.
 *
 * Reuses the legacy `InstallerEndpointsList` component since the
 * notification endpoint editor is complex and not yet migrated.
 */
export function InstallerNotificationsStep({
  endpointsGatus,
  setEndpointsGatus,
  endpointsCustom,
  setEndpointsCustom,
  goNext,
  goBack
}: InstallerNotificationsStepProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-card">
      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-foreground">Notifications</h2>
        <p className="tw:text-sm tw:text-muted-foreground tw:mt-1">
          Configure notification endpoints for this package.
        </p>
      </div>

      <Card>
        <CardContent>
          <InstallerEndpointsList
            endpointsGatus={endpointsGatus}
            setEndpointsGatus={setEndpointsGatus}
            endpointsCustom={endpointsCustom}
            setEndpointsCustom={setEndpointsCustom}
          />
        </CardContent>
      </Card>

      <div className="tw:flex tw:items-center tw:justify-between tw:pt-2">
        <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
          <ArrowLeft className="tw:size-4" />
          Back
        </Button>
        <Button onClick={goNext}>Accept &amp; Continue</Button>
      </div>
    </div>
  );
}
