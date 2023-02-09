import React from "react";
import { useSelector } from "react-redux";
import { getVolumes } from "services/dappnodeStatus/selectors";
import { DataList } from "./DataList";
import { prettyVolumeName, prettyBytes } from "utils/format";
import { VolumeMapping } from "@dappnode/common";

export function Vols({
  dnpName,
  volumes
}: {
  dnpName: string;
  volumes: VolumeMapping[];
}) {
  const volumesData = useSelector(getVolumes);

  return (
    <DataList
      title={"Volumes"}
      data={[...(volumes || [])]
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
          const prettyVol = prettyVolumeName(name || "", dnpName);
          const prettyVolString = [prettyVol.owner, prettyVol.name]
            .filter(s => s)
            .join(" - ");
          return {
            name: name ? prettyVolString : container || "Unknown",
            size: size
              ? prettyBytes(size)
              : !name
              ? "(bind) " + host || ""
              : "...",
            extra: mountpoint ? `(in ${mountpoint})` : undefined
          };
        })
        .map(({ name, size, extra }) => (
          <>
            <span style={{ opacity: "0.5" }}>{name}:</span> {size} {extra}
          </>
        ))}
    />
  );
}
