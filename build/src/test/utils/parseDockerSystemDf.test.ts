import "mocha";
import { expect } from "chai";
import {
  mockDnp,
  mockVolume,
  mockDockerSystemDfDataSample
} from "../testUtils";

import parseDockerSystemDf from "../../src/utils/parseDockerSystemDf";

describe("Util: parseDockerSystemDf", function() {
  it("should extend the dnpList", () => {
    const volumeName = mockDockerSystemDfDataSample.Volumes[0].Name;
    const volumeSizePretty = "1.11 GB";
    const volumeLinks =
      mockDockerSystemDfDataSample.Volumes[0].UsageData.RefCount;

    const dockerListOutput = [
      {
        ...mockDnp,
        volumes: [
          {
            ...mockVolume,
            name: undefined,
            type: "bind",
            path: "/etc/hostname"
          },
          {
            ...mockVolume,
            type: "volume",
            name: volumeName,
            path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data"
          }
        ]
      }
    ];

    const res = parseDockerSystemDf({
      dockerSystemDfData: mockDockerSystemDfDataSample,
      dnpList: dockerListOutput
    });
    expect(res).to.deep.equal([
      {
        ...mockDnp,
        volumes: [
          {
            ...mockVolume,
            name: undefined,
            type: "bind",
            path: "/etc/hostname"
          },
          {
            ...mockVolume,
            type: "volume",
            name: volumeName,
            path: "/var/lib/docker/volumes/dncore_vpndnpdappnodeeth_data/_data",
            links: volumeLinks,
            size: volumeSizePretty
          }
        ]
      }
    ]);
  });
});
