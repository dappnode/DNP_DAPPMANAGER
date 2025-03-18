import React, { useEffect, useState } from "react";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { EndpointItem } from "./EndpointItem.js";
import { Endpoint } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import { api } from "api";

interface ManagePackageNotificationsProps {
  dnpName: string;
  endpoints: Endpoint[];
}

export function ManagePackageNotifications({ dnpName, endpoints }: ManagePackageNotificationsProps) {
  const [pkgEndpoints, setPkgEndpoints] = useState(endpoints);
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(endpoints.some((ep) => ep.enabled));

  // Sync state when `endpoints` prop changes, but keep user modifications
  useEffect(() => {
    setPkgEndpoints((prevPkgEndpoints) => {
      const updatedEndpoints = endpoints.map((newEp) => {
        const existingEp = prevPkgEndpoints.find((ep) => ep.name === newEp.name);
        return existingEp ? { ...existingEp, ...newEp } : newEp;
      });
      return updatedEndpoints;
    });
  }, [endpoints]);

  // Handle switch toggle to enable/disable all endpoints
  const handlePkgToggle = () => {
    const newEnabledState = !pkgNotificationsEnabled;
    setPkgEndpoints((prevPkgEndpoints) => prevPkgEndpoints.map((ep) => ({ ...ep, enabled: newEnabledState })));
    setPkgNotificationsEnabled(newEnabledState);
  };

  useEffect(() => {
    // TODO: Implement timeOut that waits for more config updates before sending the new Endpoints config
    api.gatusUpdateEndpoints({ dnpName, updatedEndpoints: pkgEndpoints });
  }, [pkgEndpoints]);
  return (
    <div key={String(dnpName)} className="notifications-settings">
      <div className="title-switch-row">
        <SubTitle className="notifications-pkg-name">{prettyDnpName(dnpName)}</SubTitle>
        <Switch checked={pkgNotificationsEnabled} onToggle={handlePkgToggle} />
      </div>
      {pkgNotificationsEnabled && (
        <div className="endpoint-list-card">
          {pkgEndpoints.map((endpoint, i) => (
            <EndpointItem
              key={endpoint.name}
              endpoint={endpoint}
              index={i}
              numEndpoints={pkgEndpoints.length}
              setPkgEndpoints={setPkgEndpoints}
            />
          ))}
        </div>
      )}
    </div>
  );
}
