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
  const isStateUpdatedByUser = useRef(false);

  // Synchronize state with props when they change
  useEffect(() => {
    setEndpointsGatus([...gatusEndpoints]);
    setEndpointsCustom([...customEndpoints]);
    setPkgNotificationsEnabled(
      gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled)
    );
  }, [gatusEndpoints, customEndpoints]);

  // Handle switch toggle to enable/disable all endpoints
  const handlePkgToggle = () => {
    const newEnabledState = !pkgNotificationsEnabled;
    isStateUpdatedByUser.current = true;
    setEndpointsGatus((prevGatusEndpoints) =>
      prevGatusEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState }))
    );
    setEndpointsCustom((prevCustomEndpoints) =>
      prevCustomEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState }))
    );
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
              setGatusEndpoints={(updatedEndpoints) => {
                isStateUpdatedByUser.current = true;
                setEndpointsGatus(updatedEndpoints);
              }}
            />
          ))}
          {endpointsCustom.map((endpoint, i) => (
            <CustomEndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={endpointsCustom.length}
              setCustomEndpoints={(updatedEndpoints) => {
                isStateUpdatedByUser.current = true;
                setEndpointsCustom(updatedEndpoints);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
