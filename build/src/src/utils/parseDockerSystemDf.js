function parseDockerSystemDf({ data, dnpList }) {
  if (!data) throw Error("on parseDockerSystemDf, data is not defined");

  // data = {
  //   Volumes: [
  //     {
  //       Name: "my-volume",
  //       Driver: "local",
  //       Mountpoint: "/var/lib/docker/volumes/my-volume/_data",
  //       Labels: null,
  //       Scope: "local",
  //       Options: null,
  //       UsageData: {
  //         Size: 10920104,
  //         RefCount: 2
  //       }
  //     }
  //   ]
  // };
  const correctedParsedDataObj = {};
  data.Volumes.forEach(vol => {
    const name = vol.Name;
    const links = vol.UsageData.RefCount;
    const size = vol.UsageData.Size;
    correctedParsedDataObj[name] = { links, size };
  });

  if (dnpList) {
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
  } else {
    return correctedParsedDataObj;
  }
}

module.exports = parseDockerSystemDf;
