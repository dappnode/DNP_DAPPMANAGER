import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { Endpoint } from "../Settings";
import  React, { useState } from "react";
import { EndpointItem } from "./EndpointItem";

export function ManagePackageSection({ pkg, endpoints }: { pkg: string; endpoints: Endpoint[] }) {
    const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(true);
  
    const handlePkgToggle = () => {
      // TODO: update "notifications.yaml" file
      setPkgNotificationsEnabled(!pkgNotificationsEnabled);
    };
  
    return (
      <div key={String(pkg)}>
        <div className="title-switch-row">
          <SubTitle className="notifications-pkg-name">{pkg}</SubTitle>
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