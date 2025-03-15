import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useState } from "react";
import { EndpointItem } from "./EndpointItem";
import { Endpoint } from "@dappnode/types";
import { prettyDnpName } from "utils/format";

interface ManagePackageSectionProps {
  dnpName: string;
  endpoints: Endpoint[];
}
export function ManagePackageSection({ dnpName, endpoints }: ManagePackageSectionProps) {
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(endpoints.some((ep) => ep.enabled));
  const [pkgEndpoints, setPkgEndpoints] = useState(endpoints);

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
