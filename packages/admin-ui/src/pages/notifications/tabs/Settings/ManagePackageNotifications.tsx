import React, { useEffect, useState, useRef } from "react";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { GatusEndpointItem } from "./GatusEndpointItem.js";
import { CustomEndpointItem } from "./CustomEndpointItem.js";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import { api } from "api";

interface ManagePackageNotificationsProps {
  dnpName: string;
  gatusEndpoints: GatusEndpoint[];
  customEndpoints: CustomEndpoint[];
  isCore: boolean;
}

export function ManagePackageNotifications({
  dnpName,
  gatusEndpoints,
  customEndpoints,
  isCore
}: ManagePackageNotificationsProps) {
  const [endpointsGatus, setEndpointsGatus] = useState([...gatusEndpoints]);
  const [endpointsCustom, setEndpointsCustom] = useState([...customEndpoints]);
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(
    gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled)
  );

  // Needed to track if the state was updated by the user. Otherwise, api.notificationsUpdateEndpoints will be called when rendering the component
  const isStateUpdatedByUser = useRef(false);

  // Synchronize state with the latest data from props
  useEffect(() => {
    setEndpointsGatus([...gatusEndpoints]);
    setEndpointsCustom([...customEndpoints]);
    setPkgNotificationsEnabled(gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled));
  }, [gatusEndpoints, customEndpoints]);

  // Handle switch toggle to enable/disable all endpoints
  const handlePkgToggle = () => {
    const newEnabledState = !pkgNotificationsEnabled;
    setEndpointsGatus((prevGatusEndpoints) => {
      isStateUpdatedByUser.current = true;
      return prevGatusEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState }));
    });
    setEndpointsCustom((prevCustomEndpoints) => {
      isStateUpdatedByUser.current = true;
      return prevCustomEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState }));
    });
    setPkgNotificationsEnabled(newEnabledState);
  };

  useEffect(() => {
    if (isStateUpdatedByUser.current) {
      isStateUpdatedByUser.current = false;
      api.notificationsUpdateEndpoints({
        dnpName,
        notificationsConfig: {
          endpoints: endpointsGatus.length > 0 ? endpointsGatus : undefined,
          customEndpoints: endpointsCustom.length > 0 ? endpointsCustom : undefined
        },
        isCore: isCore
      });
    }
  }, [endpointsGatus, endpointsCustom]);

  return (
    <div key={String(dnpName)} className="notifications-settings">
      <div className="title-switch-row">
        <SubTitle className="notifications-pkg-name">{prettyDnpName(dnpName)}</SubTitle>
        <Switch checked={pkgNotificationsEnabled} onToggle={handlePkgToggle} />
      </div>
      {pkgNotificationsEnabled && (
        <div className="endpoint-list-card">
          {endpointsGatus.map((endpoint, i) => (
            <GatusEndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={endpointsGatus.length}
              setGatusEndpoints={setEndpointsGatus}
            />
          ))}
          {endpointsCustom.map((endpoint, i) => (
            <CustomEndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={endpointsCustom.length}
              setCustomEndpoints={setEndpointsCustom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
