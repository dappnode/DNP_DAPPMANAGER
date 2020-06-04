import React from "react";
import DataList from "./DataList";
import { prettyVolumeName, prettyBytes } from "utils/format";
import { PackageContainer } from "types";

export default function Vols({
  dnp,
  volumesDetail
}: {
  dnp: PackageContainer;
  volumesDetail: {
    [volumeName: string]: {
      size?: string; // "823203"
      devicePath: string; // "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data"
      mountpoint?: string; // "/dev1/data"
    };
  };
}) {
  if (dnp.volumes && !Array.isArray(dnp.volumes)) {
    console.error("volumes must be an array ", dnp.volumes);
    return null;
  }
  return (
    <DataList
      title={"Volumes"}
      data={[...(dnp.volumes || [])]
        // Order volumes before bind mounts
        .sort(v1 => (v1.name ? -1 : 1))
        // Order volumes with a bigger size first
        .sort(v1 => ((v1.name || "").includes("data") ? -1 : 0))
        // Display style:
        // - dncore_vpndnpdappnodeeth_data: 866B
        // - /etc/hostname: - (bind)
        .map(({ name, container, size, host }) => {
          const volumeDetail = volumesDetail[name || ""];
          const mountpointSize = volumeDetail ? volumeDetail.size : undefined;
          const mountpoint = volumeDetail ? volumeDetail.mountpoint : undefined;
          const prettyVol = prettyVolumeName(name || "", dnp.name);
          const prettyVolString = [prettyVol.owner, prettyVol.name]
            .filter(s => s)
            .join(" - ");
          return {
            name: name ? prettyVolString : container || "Unknown",
            size: mountpointSize
              ? prettyBytes(parseInt(mountpointSize))
              : typeof size === "number" && !isNaN(size)
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
