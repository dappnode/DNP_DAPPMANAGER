import { ContainerInterface } from "../types";

const Parser = require("table-parser");

export default function parseDockerSystemDf({
  data,
  dnpList
}: {
  data: string;
  dnpList: ContainerInterface[];
}): ContainerInterface[] {
  if (!data) throw Error("on parseDockerSystemDf, data is not defined");

  const volumeData = data.split("Local Volumes space usage:")[1] || "";
  // return output;
  const parsedData: {
    VOLUME: string[];
    NAME: string[];
    LINKS: string[];
    SIZE: string[];
  }[] = Parser.parse(volumeData.trim());
  // Correct output, turn arrays into strings
  // parsedData = [
  //   { VOLUME: [ 'dncore_dappmanagerdnpdappnodeeth_data', '1' ],
  //   NAME: [ 'dncore_dappmanagerdnpdappnodeeth_data' ],
  //   LINKS: [ '1' ],
  //   SIZE: [ '1.319kB' ]
  // }, ...]
  // ==== into ====>
  // {
  //   'dncore_dappmanagerdnpdappnodeeth_data': {
  //     links: '1',
  //     size: '1.319kB'
  //   }, ...
  // }
  const correctedParsedDataObj: {
    [volumeName: string]: { links: string; size: string };
  } = {};
  parsedData.forEach(volumeObj => {
    const name = (volumeObj.VOLUME || [])[0];
    const links = (volumeObj.LINKS || [])[0];
    const size = (volumeObj.SIZE || [])[0];
    correctedParsedDataObj[name] = { links, size };
  });

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
