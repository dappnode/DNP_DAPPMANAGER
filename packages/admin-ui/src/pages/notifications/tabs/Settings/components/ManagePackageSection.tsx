import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useState } from "react";
import { EndpointItem } from "./EndpointItem";
import { Endpoint } from "@dappnode/types";
import { prettyDnpName } from "utils/format";

export function ManagePackageSection({ dnpName, endpoints }: { dnpName: string; endpoints: Endpoint[] }) {
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(true);

  const handlePkgToggle = () => {
    // TODO: update "notifications.yaml" file
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
          {endpoints.map((endpoint, i) => (
            <EndpointItem endpoint={endpoint} index={i} numEndpoints={endpoints.length} />
          ))}
        </div>
      )}
    </div>
  );
}
