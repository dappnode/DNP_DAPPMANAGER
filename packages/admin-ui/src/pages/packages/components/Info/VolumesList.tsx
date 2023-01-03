import React, { useState } from "react";
import { useSelector } from "react-redux";
import { flatten, uniqBy, orderBy } from "lodash-es";
import { getVolumes } from "services/dappnodeStatus/selectors";
import { api } from "api";
import { BsTrash } from "react-icons/bs";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";
import { prettyVolumeName, prettyBytes, prettyDnpName } from "utils/format";
import { InstalledPackageDetailData } from "@dappnode/common";
import "./volumesList.scss";

interface WarningItem {
  title: string;
  body: string;
}

export const VolumesList = ({ dnp }: { dnp: InstalledPackageDetailData }) => {
  const [showAll, setShowAll] = useState(false);

  const { dnpName } = dnp;

  async function packageRestartVolumes(volumeName?: string) {
    const warningsList: WarningItem[] = [];
    const prettyName = prettyDnpName(dnpName);

    // If there are NOT conflicting volumes,
    // Display a dialog to confirm volumes reset
    await new Promise<void>(resolve =>
      confirm({
        title: `Removing ${prettyName} data`,
        text: `This action cannot be undone. If this DAppNode Package is a blockchain node, it will lose all the chain data and start syncing from scratch.`,
        list: warningsList,
        label: "Remove volumes",
        onClick: resolve
      })
    );

    await withToastNoThrow(
      () => api.packageRestartVolumes({ dnpName, volumeId: volumeName }),
      {
        message: `Removing volumes of ${prettyName}...`,
        onSuccess: `Removed volumes of ${prettyName}`
      }
    );
  }

  const volumesData = useSelector(getVolumes);
  const volumes = uniqBy(
    flatten(dnp.containers.map(container => container.volumes)),
    vol => vol.name
  )
    .filter(vol => vol.name)
    // Order volumes before bind mounts
    .sort(v1 => (v1.name ? -1 : 1))
    // Order volumes with a bigger size first
    .sort(v1 => ((v1.name || "").includes("data") ? -1 : 0))
    // Display style:
    // - dncore_vpndnpdappnodeeth_data: 866B
    // - /etc/hostname: - (bind)
    .map(({ name, container, host }) => {
      const volumeData = volumesData.find(v => v.name === name);
      const size = volumeData?.size;
      const mountpoint = volumeData?.mountpoint;
      const prettyVol = prettyVolumeName(name || "", dnp.dnpName);
      const prettyVolString = [prettyVol.owner, prettyVol.name]
        .filter(s => s)
        .join(" - ");
      return {
        name: name || host,
        prettyName: name ? prettyVolString : container || "Unknown",
        size,
        mountpoint
      };
    });

  if (volumes.length === 0) {
    return null;
  }

  const isTotalVolumeSizeIllDefined = volumes.some(v => !v.size);

  const totalVolumeSize = volumes.reduce(
    (total, vol) => total + (vol.size || 0),
    0
  );

  const sortVolumesByKeys: (keyof typeof volumes[0])[] = ["size", "prettyName"];

  return (
    <div className="list-grid container-volumes">
      <header>Volume</header>
      <header className="center">Size</header>
      <header className="center">Remove</header>

      {/* All containers entry */}
      <React.Fragment>
        <span className="name">
          <span>All volumes</span>

          <span className="see-all" onClick={() => setShowAll(x => !x)}>
            {showAll ? <BsChevronContract /> : <BsChevronExpand />}
          </span>
        </span>
        <span>
          {isTotalVolumeSizeIllDefined ? "-" : prettyBytes(totalVolumeSize)}
        </span>

        <BsTrash
          className="trash-icon"
          onClick={() => packageRestartVolumes()}
        />
      </React.Fragment>

      {showAll &&
        orderBy(volumes, sortVolumesByKeys, ["desc", "asc"]).map(vol => (
          <React.Fragment key={vol.name}>
            <span className="name">{prettyDnpName(vol.prettyName)}</span>
            <span>
              {typeof vol.size === "number" ? prettyBytes(vol.size) : "-"}
            </span>

            <BsTrash
              className="trash-icon"
              onClick={() => packageRestartVolumes(vol.name)}
            />
          </React.Fragment>
        ))}
    </div>
  );
};
