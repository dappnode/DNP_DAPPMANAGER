import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { useSelector } from "react-redux";
import isIpv4 from "utils/isIpv4";
import { withToastNoThrow } from "components/toast/Toast";
// Components
import { renderResponse } from "components/SwrRender";
import Card from "components/Card";
// External
import { PackageContainer } from "types";
import Switch from "components/Switch";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { shortNameCapitalized as sn } from "utils/format";
import { confirm } from "components/ConfirmDialog";
import { InstalledPackageData } from "common";
import { MdChevronRight } from "react-icons/md";

type ContainerExposedMap = { [containerName: string]: boolean };

export function Network() {
  const dnpsRequest = useApi.packagesGet();
  const [status, setStatus] = useState<ContainerExposedMap>({});

  async function exposeContainers(
    containers: PackageContainer[],
    exposed: boolean
  ): Promise<void> {
    try {
      if (exposed) {
        await new Promise<void>(resolve =>
          confirm({
            title: "Exposing container",
            text:
              "Are you sure you want to expose this service to the public internet?",
            onClick: resolve
          })
        );
      }

      const id = containers.map(c => c.containerName).join(" ");
      withToastNoThrow(
        async () => {
          await new Promise(r => setTimeout(r, 1000));
          for (const container of containers)
            setStatus(x => ({ ...x, [container.containerName]: exposed }));
        },
        {
          message: `Exposing ${id}`,
          onSuccess: `Exposed ${id}`
        }
      );
    } catch (e) {
      //
    }
  }

  return renderResponse(
    dnpsRequest,
    ["Loading installed DAppNode Packages"],
    dnps => {
      return (
        <Card spacing>
          <div className="list-grid auto-updates">
            {/* Table header */}
            <span className="state-badge" />
            <span className="name" />
            <span className="last-update header">Last auto-update</span>
            <span className="header">Exposed</span>

            <hr />
            {/* Items of the table */}
            {dnps.map(dnp => (
              <ContainerList
                key={dnp.dnpName}
                dnp={dnp}
                status={status}
                exposeContainers={exposeContainers}
              />
            ))}
          </div>
        </Card>
      );
    }
  );
}

function ContainerList({
  dnp,
  status,
  exposeContainers
}: {
  dnp: InstalledPackageData;
  status: ContainerExposedMap;
  exposeContainers: (containers: PackageContainer[], exposed: boolean) => void;
}) {
  const [showAll, setShowAll] = useState<boolean>();

  const dnpEnabled = dnp.containers.some(
    container => status[container.containerName]
  );

  return (
    <React.Fragment>
      {showAll && <hr />}

      {/* DNP entry */}

      <OnOffBadge on={dnpEnabled} />

      <span className="name">
        <span>{sn(dnp.dnpName)}</span>
        {dnp.containers.length > 1 && (
          <span className="see-all" onClick={() => setShowAll(x => !x)}>
            {showAll ? <BsChevronContract /> : <BsChevronExpand />}
          </span>
        )}
      </span>

      <span className="last-update"></span>
      <Switch
        checked={dnpEnabled ? true : false}
        onToggle={checked => exposeContainers(dnp.containers, checked)}
      />

      {/* Container display */}
      {showAll &&
        [...dnp.containers]
          .sort((a, b) => a.serviceName.localeCompare(b.serviceName))
          .map(container => {
            const containerEnabled = status[container.containerName];
            return (
              <React.Fragment key={container.serviceName}>
                <OnOffBadge on={containerEnabled} />

                <span className="name">
                  <MdChevronRight className="arrow" />
                  {sn(container.serviceName)}
                </span>
                <span className="last-update"></span>
                <Switch
                  checked={containerEnabled ? true : false}
                  onToggle={checked => exposeContainers([container], checked)}
                />
              </React.Fragment>
            );
          })}

      {showAll && <hr />}
    </React.Fragment>
  );
}

function OnOffBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`state-badge center badge-${on ? "success" : "secondary"}`}
      style={{ opacity: 0.85 }}
    >
      <span className="content">{on ? "on" : "off"}</span>
    </span>
  );
}
