import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
// Components
import CardList from "components/CardList";
import Button from "components/Button";
// Utils
import { wifiName, ipfsName } from "params";
import { VolumeMapping, ContainerState } from "types";
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

  const namedVols = (volumes || []).filter(vol => vol.name);
  const namedOwnedVols = namedVols.filter(vol => vol.isOwner);
  const namedExternalVols = namedVols
    .filter(vol => !vol.isOwner && vol.owner)
    .map(vol => ({
      name: vol.name,
      owner: vol.owner,
      ownerPath: getRootPath(vol.owner || "") + "/" + vol.owner
    }));

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
          {namedOwnedVols.length
            ? `Deleting the volumes is a permanent action and all data will be lost.`
            : "This DAppNode Package is not the owner of any named volumes."}
          {namedExternalVols.map(vol => (
            <div key={vol.name} style={{ opacity: 0.6 }}>
              Go to <Link to={vol.ownerPath}>{vol.owner}</Link> to remove the
              volume {vol.name}
            </div>
          ))}
        </div>
      ),
      action: () => dispatch(packageRestartVolumes(id)),
      availableForCore: true,
      disabled: !namedOwnedVols.length,
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
