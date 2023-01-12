import { expect } from "chai";
import { getContainersAndVolumesToRemove } from "../../../../src/modules/docker";
import { DockerVolumeListItem } from "../../../../src/modules/docker/api";
import { normalizeProjectName } from "../../../../src/modules/docker/volumesData";
import { InstalledPackageData } from "@dappnode/common";
import { mockContainer, mockDnp, mockVolume } from "../../../testUtils";

describe.skip("docker / getContainersAndVolumesToRemove", () => {
  const dnpName = "test.dnp.dappnode.eth";
  const containerNames = {
    container1: "DAppNodePackage-1.test.dnp.dappnode.eth",
    container2: "DAppNodePackage-2.test.dnp.dappnode.eth"
  };
  const volNames = {
    vol1: "vol1",
    vol2: "vol2"
  };

  const dnp: InstalledPackageData = {
    ...mockDnp,
    dnpName,
    isCore: false,
    containers: [
      {
        ...mockContainer,
        dnpName,
        containerName: containerNames.container1,
        volumes: [
          { ...mockVolume, name: volNames.vol1 },
          { ...mockVolume, name: volNames.vol2 }
        ]
      },
      // Container with no volumes, should not be deleted
      {
        ...mockContainer,
        dnpName,
        containerName: containerNames.container2,
        volumes: []
      }
    ]
  };

  const mockDockerVolumeListItem: DockerVolumeListItem = {
    CreatedAt: "2019-12-10T11:54:22+01:00",
    Driver: "local",
    Labels: {},
    Mountpoint: "/var/lib/docker/volumes/test/test",
    Name: "test",
    Options: null,
    Scope: "local"
  };

  const volumes: DockerVolumeListItem[] = [
    {
      ...mockDockerVolumeListItem,
      Name: volNames.vol1,
      Labels: {
        "com.docker.compose.project": normalizeProjectName(dnpName)
      }
    },
    // Volume 2 is from a different project, so it should not be removed
    {
      ...mockDockerVolumeListItem,
      Name: volNames.vol2,
      Labels: {
        "com.docker.compose.project": normalizeProjectName(
          "other.dnp.dappnode.eth"
        )
      }
    }
  ];

  const testCases: {
    id: string;
    args: Parameters<typeof getContainersAndVolumesToRemove>;
    result: ReturnType<typeof getContainersAndVolumesToRemove>;
  }[] = [
    {
      id: "Normal case",
      args: [dnp, undefined, volumes],
      result: {
        containersToRemove: [containerNames.container1],
        volumesToRemove: [volNames.vol1]
      }
    }
  ];

  for (const { id, args, result } of testCases) {
    it(id, () => {
      expect(getContainersAndVolumesToRemove(...args)).to.deep.equal(result);
    });
  }
});
