import { PackageContainer } from "../types";
import { DockerApiSystemDfReturn } from "../modules/docker/dockerApi";
import prettyBytes from "pretty-bytes";

export default function parseDockerSystemDf({
  dockerSystemDfData,
  dnpList
}: {
  dockerSystemDfData: DockerApiSystemDfReturn;
  dnpList: PackageContainer[];
}): PackageContainer[] {
  const correctedParsedDataObj: {
    [volumeName: string]: { links: number; size: string };
  } = {};

  for (const vol of dockerSystemDfData.Volumes) {
    const name = vol.Name;
    const links = vol.UsageData.RefCount;
    const size = prettyBytes(vol.UsageData.Size);
    correctedParsedDataObj[name] = { links, size };
  }

  dnpList = dnpList.map(dnp => {
    if (!dnp.volumes) {
      return dnp;
    }
    dnp.volumes = dnp.volumes.map(volume => {
      if (volume.name && correctedParsedDataObj[volume.name]) {
        volume = {
          ...volume,
          ...correctedParsedDataObj[volume.name]
        };
      }
      return volume;
    });
    return dnp;
  });
  return dnpList;
}
