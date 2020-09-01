import React, { useState } from "react";
import { packageRestart } from "../../actions";
import { StateBadge } from "../StateBadge";
import { MdRefresh, MdPauseCircleOutline } from "react-icons/md";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { InstalledPackageData } from "common";
import { withToastNoThrow } from "components/toast/Toast";
import { api } from "api";
import { shortNameCapitalized as sn } from "utils/format";
import "./containerList.scss";

export const ContainerList = ({ dnp }: { dnp: InstalledPackageData }) => {
  const [showAll, setShowAll] = useState(false);

  async function packageStartStop(containerName: string) {
    withToastNoThrow(() => api.packageStartStop({ containerName }), {
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
        <StateBadge state={dnp.containers[0].state} />
        <span className="name">
          <span>{sn(dnp.dnpName)} </span>
          {dnp.containers.length > 1 && (
            <span className="see-all" onClick={() => setShowAll(x => !x)}>
              {showAll ? <BsChevronContract /> : <BsChevronExpand />}
            </span>
          )}
        </span>
        <MdPauseCircleOutline
          style={{ fontSize: "1.05rem" }}
          onClick={() => packageStartStop(dnp.containers[0].containerName)}
        />
        <MdRefresh
          style={{ fontSize: "1.05rem" }}
          onClick={() => packageRestart(dnp).catch(console.error)}
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
              onClick={() => packageStartStop(container.containerName)}
            />
            <MdRefresh
              style={{ fontSize: "1.05rem" }}
              onClick={() => packageRestart(dnp).catch(console.error)}
            />
          </React.Fragment>
        ))}
    </div>
  );
};
