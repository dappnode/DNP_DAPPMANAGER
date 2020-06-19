import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// Components
import CardList from "components/CardList";
import Button from "components/Button";
// Utils
import { wifiName, ipfsName } from "params";
import { VolumeMapping, ContainerState } from "types";
import { getVolumes } from "services/dappnodeStatus/selectors";
import {
  packageStartStop,
  packageRestartVolumes,
  packageRemove,
  packageRestart
} from "pages/packages/actions";

function getRootPath(dnpName: string) {
  return [
    "dappmanager.dnp.dappnode.eth",
    "ipfs.dnp.dappnode.eth",
    "wifi.dnp.dappnode.eth",
    "admin.dnp.dappnode.eth",
    "vpn.dnp.dappnode.eth",
    "bind.dnp.dappnode.eth",
    "wamp.dnp.dappnode.eth"
  ].includes(dnpName)
    ? "/system"
    : "/packages";
}

export function Controls({
  id,
  isCore,
  state,
  volumes
}: {
  id: string;
  isCore: boolean;
  state: ContainerState;
  volumes: VolumeMapping[];
}) {
  const dispatch = useDispatch();
  const volumesData = useSelector(getVolumes);

  let hasNamedOwnedVols: boolean = false;
  const namedExternalVols: { name: string; owner: any }[] = [];
  for (const vol of volumes)
    if (vol.name) {
      const volumeData = volumesData.find(v => v.name === vol.name);
      const owner = volumeData?.owner;
      if (owner === id) hasNamedOwnedVols = true;
      else if (owner) namedExternalVols.push({ name: vol.name, owner });
    }

  const actions = [
    {
      name:
        state === "running" ? "Stop" : state === "exited" ? "Start" : "Toggle",
      text: "Toggle the state of the package from running to paused",
      action: () => dispatch(packageStartStop(id)),
      availableForCore: false,
      whitelist: [wifiName, ipfsName],
      type: "secondary"
    },
    {
      name: "Restart",
      text:
        "Restarting a package will interrupt the service during 1-10s but preserve its data",
      action: () => dispatch(packageRestart(id)),
      availableForCore: true,
      type: "secondary"
    },
    {
      name: "Remove volumes",
      text: (
        <div>
          {hasNamedOwnedVols
            ? `Deleting the volumes is a permanent action and all data will be lost.`
            : "This DAppNode Package is not the owner of any named volumes."}
          {namedExternalVols.map(vol => (
            <div key={vol.name} style={{ opacity: 0.6 }}>
              Go to{" "}
              <Link to={`${getRootPath(vol.owner)}/${vol.owner}`}>
                {vol.owner}
              </Link>{" "}
              to remove the volume {vol.name}
            </div>
          ))}
        </div>
      ),
      action: () => dispatch(packageRestartVolumes(id)),
      availableForCore: true,
      disabled: !hasNamedOwnedVols,
      type: "danger"
    },
    {
      name: "Remove ",
      text: "Deletes a package permanently.",
      action: () => dispatch(packageRemove(id)),
      availableForCore: false,
      type: "danger"
    }
  ];

  // Table style -> Removes the space below the table, only for tables in cards
  return (
    <CardList>
      {actions
        .filter(
          action =>
            action.availableForCore ||
            !isCore ||
            (action.whitelist || []).includes(id)
        )
        .map(({ name, text, type, action, disabled }) => (
          <div key={name} className="control-item">
            <div>
              <strong>{name}</strong>
              <div>{text}</div>
            </div>
            <Button
              variant={`outline-${type}`}
              onClick={action}
              style={{ whiteSpace: "normal" }}
              disabled={disabled}
            >
              {name}
            </Button>
          </div>
        ))}
    </CardList>
  );
}
