import SubTitle from "components/SubTitle";
import React, { useState } from "react";
import Switch from "components/Switch";

import "../notifications.scss";

interface GatusConfig {
  endpoints: Endpoint[];
}

interface Endpoint {
  name: string;
  enabled: boolean;
  url: string;
  method: string;
  conditions: string[];
  interval: string; // e.g., "1m"
  group: string;
  description: string; // dappnode specific
  metric?: {
    // dappnode specific
    min: number;
    max: number;
    unit: string; // e.g ºC
  };
}

export function NotificationsSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const fakeNotifications: Map<String, GatusConfig> = new Map([
    [
      "Dappmanager",
      {
        endpoints: [
          {
            name: "Installed packages updates",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Core",
            description: "Sends a notification whenever a new version of an installed package is released"
          }
        ]
      }
    ],
    [
      "DMS",
      {
        endpoints: [
          {
            name: "Disk space",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Core",
            description: "Sends a notification whenever your storage disk exceeds the specified percentage.",
            metric: {
              min: 0,
              max: 100,
              unit: "%"
            }
          }
        ]
      }
    ],

    [
      "Web3Signer",
      {
        endpoints: [
          {
            name: "Validator offline / back online",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Staking",
            description: "Sends a notification whenever one of your validators toggles its state."
          },
          {
            name: "Missed attestation",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Staking",
            description: "Sends a notification whenever one of your validators misses an attestation."
          },
          {
            name: "Missed proposal",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Staking",
            description: "Sends a notification whenever one of your validators misses a block proposal."
          },
          {
            name: "Submitted Proposal",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Staking",
            description: "Sends a notification whenever one of your validators submits a block proposal successfully."
          },
          {
            name: "Efectiveness",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Staking",
            description:
              "Sends a notification whenever the effectiveness of one of your validators falls below the specified percentage.",
            metric: {
              min: 0,
              max: 100,
              unit: "%"
            }
          }
        ]
      }
    ],
    [
      "Lido CSM",
      {
        endpoints: [
          {
            name: "Validator exited sucesfully",
            enabled: true,
            url: "",
            method: "",
            conditions: [""],
            interval: "1m",
            group: "Core",
            description:
              "Sends a notification whenever a validator has entered the exit queue automatically. No manual action required"
          }
        ]
      }
    ]
  ]);

  return (
    <div className="notifications-settings">
      <div>
        <div className="title-switch-row">
          <SubTitle className="notifications-section-title">Enable notifications</SubTitle>
          <Switch
            checked={notificationsEnabled}
            onToggle={() => {
              setNotificationsEnabled(!notificationsEnabled);
            }}
          />
        </div>
        <div>Enable notifications to retrieve a registry of notifications on your Dappnode.</div>
      </div>
      <br />
      {notificationsEnabled && (
        <div>
          <SubTitle className="notifications-section-title">Manage notifications</SubTitle>
          <div>Enable, disable and customize notifications individually.</div>
          <br />
          <div className="manage-notifications-wrapper">
            {[...fakeNotifications.entries()].map(([key, value]) => (
              <ManagePackageSection pkg={String(key)} endpoints={value.endpoints} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ManagePackageSection({ pkg, endpoints }: { pkg: string; endpoints: Endpoint[] }) {
  const [pkgNotificationsEnabled, setPkgNotificationsEnabled] = useState(true);

  const handlePkgToggle = () => {
    // TODO: update "notifications.yaml" file
    setPkgNotificationsEnabled(!pkgNotificationsEnabled);
  };

  const handleEndpointToggle = () => {};

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
        <div className="endpoints-card">
          {endpoints.map((endpoint, index) => (
            <>
              <div key={index} className="endpoint-row">
                <div>
                  <strong>{endpoint.name}</strong>
                  <div>{endpoint.description}</div>
                </div>
                <Switch
                  checked={endpoint.enabled}
                  onToggle={() => {
                    handleEndpointToggle;
                  }}
                />
              </div>
              {index + 1 < endpoints.length && <hr />}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
