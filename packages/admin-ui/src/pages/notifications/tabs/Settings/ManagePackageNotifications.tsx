import React, { useEffect, useState } from "react";
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
}

export function ManagePackageNotifications({
  dnpName,
  gatusEndpoints,
  customEndpoints
}: ManagePackageNotificationsProps) {
  const [endpointsGatus, setEndpointsGatus] = useState([...gatusEndpoints]);
  const [endpointsCustom, setEndpointsCustom] = useState([...customEndpoints]);
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(
    gatusEndpoints.some((ep) => ep.enabled) || customEndpoints.some((ep) => ep.enabled)
  );

  // Handle switch toggle to enable/disable all endpoints
  const handlePkgToggle = () => {
    const newEnabledState = !pkgNotificationsEnabled;
    setEndpointsGatus((prevGatusEndpoints) => prevGatusEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState })));
    setEndpointsCustom((prevCustomEndpoints) => prevCustomEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState })));
    setPkgNotificationsEnabled(newEnabledState);
  };

  useEffect(() => {
    api.notificationsUpdateEndpoints({ dnpName, notificationsConfig: { endpoints: endpointsGatus } });
  }, [endpointsGatus]);
  useEffect(() => {
    api.notificationsUpdateEndpoints({ dnpName, notificationsConfig: { customEndpoints: endpointsCustom } });
  }, [endpointsCustom]);
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
