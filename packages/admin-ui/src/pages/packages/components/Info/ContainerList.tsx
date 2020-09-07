import React, { useState } from "react";
import { packageRestart } from "../../actions";
import { StateBadge, getWorstState } from "../StateBadge";
import { MdRefresh, MdPauseCircleOutline } from "react-icons/md";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { InstalledPackageData, PackageContainer } from "types";
import { withToastNoThrow } from "components/toast/Toast";
import { api } from "api";
import { shortNameCapitalized as sn } from "utils/format";
import "./containerList.scss";

export const ContainerList = ({ dnp }: { dnp: InstalledPackageData }) => {
  const [showAll, setShowAll] = useState(false);

  async function onRestart(container?: PackageContainer) {
    packageRestart(dnp, container).catch(console.error);
  }

  function onStartStop(container?: PackageContainer) {
    const dnpName = dnp.dnpName;
    const serviceNames = container && [container.serviceName];
    withToastNoThrow(() => api.packageStartStop({ dnpName, serviceNames }), {
      message: `Toggling ${sn(dnp.dnpName)}...`,
      onSuccess: `Toggled ${sn(dnp.dnpName)}`
    });
  }

  return (
    <div className="list-grid containers">
      <header className="center">Status</header>
      <header></header>
      <header className="center">Pause</header>
      <header className="center">Restart</header>

      {/* DNP entry */}
      <React.Fragment>
        {showAll ? <span /> : <StateBadge state={getWorstState(dnp)} />}
        <span className="name">
          <span>All containers</span>
          {dnp.containers.length > 1 && (
            <span className="see-all" onClick={() => setShowAll(x => !x)}>
              {showAll ? <BsChevronContract /> : <BsChevronExpand />}
            </span>
          )}
        </span>
        <MdPauseCircleOutline
          style={{ fontSize: "1.05rem" }}
          onClick={() => onStartStop()}
        />
        <MdRefresh
          style={{ fontSize: "1.05rem" }}
          onClick={() => onRestart()}
        />
      </React.Fragment>

      {/* Container display */}
      {showAll &&
        dnp.containers.map(container => (
          <React.Fragment key={container.serviceName}>
            <StateBadge state={container.state} />
            <span className="name">{sn(container.serviceName)}</span>
            <MdPauseCircleOutline
              style={{ fontSize: "1.05rem" }}
              onClick={() => onStartStop(container)}
            />
            <MdRefresh
              style={{ fontSize: "1.05rem" }}
              onClick={() => onRestart(container)}
            />
          </React.Fragment>
        ))}
    </div>
  );
};
