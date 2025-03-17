import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useEffect, useState } from "react";
import { EndpointItem } from "./EndpointItem";
import { Endpoint } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import { useApi } from "api";

interface ManagePackageSectionProps {
  dnpName: string;
  endpoints: Endpoint[];
}
export function ManagePackageSection({ dnpName, endpoints }: ManagePackageSectionProps) {
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(endpoints.some((ep) => ep.enabled));
  const [pkgEndpoints, setPkgEndpoints] = useState(endpoints);

  useEffect(() => {
    // TODO: Implement timeOut that waits for more config updates before sending the new Endpoints config
    const updateConfig = async () => {
      useApi.gatusUpdateEndpoints({
        dnpName,
        updatedEndpoints: pkgEndpoints});
    };
    updateConfig();
  }, [pkgEndpoints]);

  const handlePkgToggle = () => {
    setPkgEndpoints(pkgEndpoints.map((ep) => ({ ...ep, enabled: !pkgNotificationsEnabled })));
    setPkgNotificationsEnabled(!pkgNotificationsEnabled);
  };

  return (
    <div key={String(dnpName)} className="notifications-settings">
      <div className="title-switch-row">
        <SubTitle className="notifications-pkg-name">{prettyDnpName(dnpName)}</SubTitle>
        <Switch
          checked={pkgNotificationsEnabled}
          onToggle={() => {
            handlePkgToggle();
          }}
        />
      </div>
      {pkgNotificationsEnabled && (
        <div className="endpoint-list-card">
          {pkgEndpoints.map((endpoint, i) => (
            <EndpointItem
              endpoint={endpoint}
              index={i}
              numEndpoints={endpoints.length}
              setPkgEndpoints={setPkgEndpoints}
            />
          ))}
        </div>
      )}
    </div>
  );
}
