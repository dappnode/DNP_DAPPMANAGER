import React, { useMemo } from "react";
import Button from "components/Button";
import { ManagePackageSection } from "pages/notifications/tabs/Settings/components/ManagePackageSection";
import { Endpoint } from "@dappnode/types";
import { useApi } from "api";

interface NotificationsProps {
  endpoints: Endpoint[];
  dnpName: string;
  goNext: () => void;
  goBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ endpoints, goBack, goNext, dnpName }) => {
  const endpointsCall = useApi.gatusGetEndpoints();
  const pkgEndpointsData = endpointsCall.data?.[dnpName];

  // Merge endpoints in order to preserve existing endpoints config when updating a package 
  const mergedEndpoints = useMemo(() => {
    if (!pkgEndpointsData) return endpoints;

    const endpointMap = new Map<string, Endpoint>();

    endpoints.forEach((endpoint) => {
      endpointMap.set(endpoint.name, endpoint);
    });

    pkgEndpointsData.forEach((retrievedEndpoint: Endpoint) => {
      endpointMap.set(retrievedEndpoint.name, {
        ...endpointMap.get(retrievedEndpoint.name), // Preserve existing config if it exists
        ...retrievedEndpoint, // Overwrite with new data
      });
    });

    return Array.from(endpointMap.values());
  }, [endpoints, pkgEndpointsData]);

  return (
    <>
      <ManagePackageSection dnpName="Enable notifications" endpoints={mergedEndpoints} />
      <div className="button-group">
        <Button onClick={goBack}>Back</Button>
        <Button variant="dappnode" onClick={goNext}>
          Next
        </Button>
      </div>
    </>
  );
};
