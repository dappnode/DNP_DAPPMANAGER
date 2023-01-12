import "mocha";
import { expect } from "chai";
import { VolumeMapping } from "@dappnode/common";

import {
  parseVolumeMappings,
  stringifyVolumeMappings,
  normalizeVolumePath
} from "../../../../src/modules/compose";

describe("volumeMappings: parse, stringify and merge", () => {
  it("should parse and stringify volume mappings", () => {
    const volumeArray = [
      "/etc/hostname:/etc/vpnname:ro",
      "/var/run/docker.sock:/var/run/docker.sock",
      "vpndnpdappnodeeth_shared:/var/spool/openvpn"
    ];
    const volumeMappings: VolumeMapping[] = [
      {
        container: "/etc/vpnname:ro",
        host: "/etc/hostname",
        name: undefined
      },
      {
        container: "/var/run/docker.sock",
        host: "/var/run/docker.sock",
        name: undefined
      },
      {
        container: "/var/spool/openvpn",
        host: "vpndnpdappnodeeth_shared",
        name: "vpndnpdappnodeeth_shared"
      }
    ];

    expect(parseVolumeMappings(volumeArray)).to.deep.equal(
      volumeMappings,
      "Wrong parse"
    );

    expect(stringifyVolumeMappings(volumeMappings)).to.deep.equal(
      volumeArray,
      "Wrong stringify"
    );
  });

  describe("Path normalization", () => {
    const paths = [
      { path: "/", res: "/" },
      { path: "/root/.ethereum/", res: "/root/.ethereum" },
      { path: "/hello///", res: "/hello" },
      { path: "ethchain_geth", res: "ethchain_geth" },
      { path: "data", res: "data" }
    ];
    for (const { path, res } of paths)
      it(`Should normalize ${path}`, () => {
        expect(normalizeVolumePath(path)).to.equal(res);
      });
  });
});
