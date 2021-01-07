import React, { useState } from "react";
import { packageRestart } from "../../actions";
import {
  StateBadgeDnp,
  StateBadgeContainer,
  StateBadgeLegend
} from "../StateBadge";
import {
  MdRefresh,
  MdPauseCircleOutline,
  MdPlayCircleOutline
} from "react-icons/md";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { InstalledPackageData, PackageContainer } from "types";
import { withToastNoThrow } from "components/toast/Toast";
import { api } from "api";
import { shortNameCapitalized as sn } from "utils/format";
import { confirm } from "components/ConfirmDialog";
import "./containerList.scss";

export const ContainerList = ({ dnp }: { dnp: InstalledPackageData }) => {
  const [showAll, setShowAll] = useState(false);

  async function onRestart(container?: PackageContainer) {
    packageRestart(dnp, container).catch(console.error);
  }

  function onStartStop(container?: PackageContainer) {
    const dnpName = dnp.dnpName;
    const serviceNames = container && [container.serviceName];
    const name = container
      ? [sn(dnpName), sn(container.serviceName)].join(" ")
      : sn(dnpName);
    withToastNoThrow(() => api.packageStartStop({ dnpName, serviceNames }), {
      message: `Toggling ${name}...`,
      onSuccess: `Toggled ${name}`
    });
  }

  function onStartStopConfirm() {
    confirm({
      title: `Disabling wifi service`,
      text:
        "You may loose wifi access to your DAppNode. Are you sure you want to disable it?",
      label: "Disable",
      onClick: () =>
        withToastNoThrow(async () => onStartStop(), {
          message: `Disabling wifi...`,
          onSuccess: `Disabled wifi`
        })
    });
  }

  function isWifiPackage() {
    if (dnp.dnpName === "wifi.dnp.dappnode.eth") return true;
    return false;
  }

  const allContainersRunning = dnp.containers.every(c => c.running);

  return (
    <div className="info-container-list">
      <div className="list-grid containers">
        <header className="center">Status</header>
        <header></header>
        <header className="center">Pause</header>
        <header className="center">Restart</header>

        {/* DNP entry */}
        <React.Fragment>
          <StateBadgeDnp dnp={dnp} />

          <span className="name">
            {dnp.containers.length > 1 ? (
              <span>All containers</span>
            ) : (
              <span>{sn(dnp.dnpName)}</span>
            )}

            {dnp.containers.length > 1 && (
              <span className="see-all" onClick={() => setShowAll(x => !x)}>
                {showAll ? <BsChevronContract /> : <BsChevronExpand />}
              </span>
            )}
          </span>

          {allContainersRunning ? (
            <MdPauseCircleOutline
              onClick={() =>
                isWifiPackage() ? onStartStopConfirm() : onStartStop()
              }
            />
          ) : (
            <MdPlayCircleOutline onClick={() => onStartStop()} />
          )}

          <MdRefresh onClick={() => onRestart()} />
        </React.Fragment>

        {/* Container display */}
        {showAll &&
          [...dnp.containers]
            .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
            .map(container => (
              <React.Fragment key={container.serviceName}>
                <StateBadgeContainer container={container} />
                <span className="name">{sn(container.serviceName)}</span>
                {container.running ? (
                  <MdPauseCircleOutline
                    onClick={() => onStartStop(container)}
                  />
                ) : (
                  <MdPlayCircleOutline onClick={() => onStartStop(container)} />
                )}
                <MdRefresh onClick={() => onRestart(container)} />
              </React.Fragment>
            ))}
      </div>

      {!showAll && <StateBadgeLegend dnps={[dnp]} />}
    </div>
  );
};
