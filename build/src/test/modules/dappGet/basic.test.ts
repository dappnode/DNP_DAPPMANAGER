import "mocha";
import { expect } from "chai";
import { PackageContainer, Dependencies } from "../../../src/types";
import { mockDnp } from "../../testUtils";
import rewiremock from "rewiremock";

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure dappGetBasic works
 * This is a lite version of the dappGet, specially though for core updates
 */

// IDE and rewiremock can figure out the type on their own
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
async function getDappBasic(
  dnpList: PackageContainer[],
  dependencies: Dependencies
) {
  async function getDependencies(): Promise<Dependencies> {
    return dependencies;
  }

  async function listContainers(): Promise<PackageContainer[]> {
    return dnpList;
  }

  const mock = await rewiremock.around(
    () => import("../../../src/modules/dappGet/basic"),
    mock => {
      mock(() => import("../../../src/modules/release/getDependencies"))
        .withDefault(getDependencies)
        .toBeUsed();
      mock(() => import("../../../src/modules/docker/listContainers"))
        .with({ listContainers })
        .toBeUsed();
    }
  );
  return mock.default;
}

describe("dappGetBasic", () => {
  it("Normal case - Should request only fetching first level dependencies, ignoring the already updated", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.1.11" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.1.10" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.1.6" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.1.0" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.1.4",
        "ipfs.dnp.dappnode.eth": "0.1.3",
        "ethchain.dnp.dappnode.eth": "0.1.4",
        "ethforward.dnp.dappnode.eth": "0.1.1",
        "vpn.dnp.dappnode.eth": "0.1.11",
        "wamp.dnp.dappnode.eth": "0.1.0",
        "admin.dnp.dappnode.eth": "0.1.6",
        "dappmanager.dnp.dappnode.eth": "0.1.10"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.1.15"
    });
    expect(result.state).to.deep.equal({
      // Core
      "core.dnp.dappnode.eth": "0.1.15",
      // Deps
      "bind.dnp.dappnode.eth": "0.1.4",
      "ipfs.dnp.dappnode.eth": "0.1.3",
      "ethchain.dnp.dappnode.eth": "0.1.4",
      "ethforward.dnp.dappnode.eth": "0.1.1",
      "vpn.dnp.dappnode.eth": "0.1.11",
      "wamp.dnp.dappnode.eth": "0.1.0"
      // Ignored deps
      // 'admin.dnp.dappnode.eth': '0.1.6',
      // 'dappmanager.dnp.dappnode.eth': '0.1.10',
    });
  });

  it("0.2.0-alpha => 0.2.0 - Should request to update all versions from alpha to 0.2.0", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.2.0-alpha" },
        { ...mockDnp, name: "bind.dnp.dappnode.eth", version: "0.2.0-alpha" },
        { ...mockDnp, name: "ipfs.dnp.dappnode.eth", version: "0.2.0-alpha" },
        {
          ...mockDnp,
          name: "ethchain.dnp.dappnode.eth",
          version: "0.2.0-alpha"
        },
        {
          ...mockDnp,
          name: "ethforward.dnp.dappnode.eth",
          version: "0.2.0-alpha"
        },
        { ...mockDnp, name: "vpn.dnp.dappnode.eth", version: "0.2.0-alpha" },
        { ...mockDnp, name: "wamp.dnp.dappnode.eth", version: "0.2.0-alpha" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.2.0-alpha" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.2.0",
        "ipfs.dnp.dappnode.eth": "0.2.0",
        "ethchain.dnp.dappnode.eth": "0.2.0",
        "ethforward.dnp.dappnode.eth": "0.2.0",
        "vpn.dnp.dappnode.eth": "0.2.0",
        "wamp.dnp.dappnode.eth": "0.2.0",
        "admin.dnp.dappnode.eth": "0.2.0",
        "dappmanager.dnp.dappnode.eth": "0.2.0"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.2.0"
    });
    expect(result.state).to.deep.equal({
      // Core
      "core.dnp.dappnode.eth": "0.2.0",
      // Deps
      "bind.dnp.dappnode.eth": "0.2.0",
      "ipfs.dnp.dappnode.eth": "0.2.0",
      "ethchain.dnp.dappnode.eth": "0.2.0",
      "ethforward.dnp.dappnode.eth": "0.2.0",
      "vpn.dnp.dappnode.eth": "0.2.0",
      "wamp.dnp.dappnode.eth": "0.2.0",
      "admin.dnp.dappnode.eth": "0.2.0"
      // Ignored deps
      // 'dappmanager.dnp.dappnode.eth': '0.2.0',
    });
  });

  it("0.2.0 => 0.2.0 - Should not update any", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "bind.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ipfs.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ethchain.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "vpn.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "wamp.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.2.0",
        "ipfs.dnp.dappnode.eth": "0.2.0",
        "ethchain.dnp.dappnode.eth": "0.2.0",
        "ethforward.dnp.dappnode.eth": "0.2.0",
        "vpn.dnp.dappnode.eth": "0.2.0",
        "wamp.dnp.dappnode.eth": "0.2.0",
        "admin.dnp.dappnode.eth": "0.2.0",
        "dappmanager.dnp.dappnode.eth": "0.2.0"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.2.0"
    });
    expect(result.state).to.deep.equal({
      // Core
      // 'core.dnp.dappnode.eth': '0.2.0',
      // Deps
      // Ignored deps
      // 'bind.dnp.dappnode.eth': '0.2.0',
      // 'ipfs.dnp.dappnode.eth': '0.2.0',
      // 'ethchain.dnp.dappnode.eth': '0.2.0',
      // 'ethforward.dnp.dappnode.eth': '0.2.0',
      // 'vpn.dnp.dappnode.eth': '0.2.0',
      // 'wamp.dnp.dappnode.eth': '0.2.0',
      // 'admin.dnp.dappnode.eth': '0.2.0',
      // 'dappmanager.dnp.dappnode.eth': '0.2.0',
    });
  });

  it("0.2.0 => 0.2.0-alpha - Should not update any", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "bind.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ipfs.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ethchain.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "vpn.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "wamp.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.2.0-alpha",
        "ipfs.dnp.dappnode.eth": "0.2.0-alpha",
        "ethchain.dnp.dappnode.eth": "0.2.0-alpha",
        "ethforward.dnp.dappnode.eth": "0.2.0-alpha",
        "vpn.dnp.dappnode.eth": "0.2.0-alpha",
        "wamp.dnp.dappnode.eth": "0.2.0-alpha",
        "admin.dnp.dappnode.eth": "0.2.0-alpha",
        "dappmanager.dnp.dappnode.eth": "0.2.0-alpha"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.2.0-alpha"
    });
    expect(result.state).to.deep.equal({
      // Core
      // 'core.dnp.dappnode.eth': '0.2.0-alpha',
      // Deps
      // Ignored deps
      // 'bind.dnp.dappnode.eth': '0.2.0',
      // 'ipfs.dnp.dappnode.eth': '0.2.0',
      // 'ethchain.dnp.dappnode.eth': '0.2.0',
      // 'ethforward.dnp.dappnode.eth': '0.2.0',
      // 'vpn.dnp.dappnode.eth': '0.2.0',
      // 'wamp.dnp.dappnode.eth': '0.2.0',
      // 'admin.dnp.dappnode.eth': '0.2.0',
      // 'dappmanager.dnp.dappnode.eth': '0.2.0',
    });
  });

  it("0.1.x => 0.2.0-alpha - Should update all to 0.2.0-alpha", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.1.11" },
        { ...mockDnp, name: "bind.dnp.dappnode.eth", version: "0.1.9" },
        { ...mockDnp, name: "ipfs.dnp.dappnode.eth", version: "0.1.6" },
        { ...mockDnp, name: "ethchain.dnp.dappnode.eth", version: "0.1.7" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.1.2" },
        { ...mockDnp, name: "vpn.dnp.dappnode.eth", version: "0.1.12" },
        { ...mockDnp, name: "wamp.dnp.dappnode.eth", version: "0.1.1" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.1.5" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.1.20" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.2.0-alpha",
        "ipfs.dnp.dappnode.eth": "0.2.0-alpha",
        "ethchain.dnp.dappnode.eth": "0.2.0-alpha",
        "ethforward.dnp.dappnode.eth": "0.2.0-alpha",
        "vpn.dnp.dappnode.eth": "0.2.0-alpha",
        "wamp.dnp.dappnode.eth": "0.2.0-alpha",
        "admin.dnp.dappnode.eth": "0.2.0-alpha",
        "dappmanager.dnp.dappnode.eth": "0.2.0-alpha"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.2.0-alpha"
    });
    expect(result.state).to.deep.equal({
      // Core
      "core.dnp.dappnode.eth": "0.2.0-alpha",
      // Deps
      "bind.dnp.dappnode.eth": "0.2.0-alpha",
      "ipfs.dnp.dappnode.eth": "0.2.0-alpha",
      "ethchain.dnp.dappnode.eth": "0.2.0-alpha",
      "ethforward.dnp.dappnode.eth": "0.2.0-alpha",
      "vpn.dnp.dappnode.eth": "0.2.0-alpha",
      "wamp.dnp.dappnode.eth": "0.2.0-alpha",
      "admin.dnp.dappnode.eth": "0.2.0-alpha",
      "dappmanager.dnp.dappnode.eth": "0.2.0-alpha"
    });
  });

  it("0.1.x => 0.2.0 - Should update all to 0.2.0", async () => {
    const dappGet = await getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.1.11" },
        { ...mockDnp, name: "bind.dnp.dappnode.eth", version: "0.1.9" },
        { ...mockDnp, name: "ipfs.dnp.dappnode.eth", version: "0.1.6" },
        { ...mockDnp, name: "ethchain.dnp.dappnode.eth", version: "0.1.7" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.1.2" },
        { ...mockDnp, name: "vpn.dnp.dappnode.eth", version: "0.1.12" },
        { ...mockDnp, name: "wamp.dnp.dappnode.eth", version: "0.1.1" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.1.5" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.1.20" }
      ],
      {
        "bind.dnp.dappnode.eth": "0.2.0",
        "ipfs.dnp.dappnode.eth": "0.2.0",
        "ethchain.dnp.dappnode.eth": "0.2.0",
        "ethforward.dnp.dappnode.eth": "0.2.0",
        "vpn.dnp.dappnode.eth": "0.2.0",
        "wamp.dnp.dappnode.eth": "0.2.0",
        "admin.dnp.dappnode.eth": "0.2.0",
        "dappmanager.dnp.dappnode.eth": "0.2.0"
      }
    );

    const result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.2.0"
    });
    expect(result.state).to.deep.equal({
      // Core
      "core.dnp.dappnode.eth": "0.2.0",
      // Deps
      "bind.dnp.dappnode.eth": "0.2.0",
      "ipfs.dnp.dappnode.eth": "0.2.0",
      "ethchain.dnp.dappnode.eth": "0.2.0",
      "ethforward.dnp.dappnode.eth": "0.2.0",
      "vpn.dnp.dappnode.eth": "0.2.0",
      "wamp.dnp.dappnode.eth": "0.2.0",
      "admin.dnp.dappnode.eth": "0.2.0",
      "dappmanager.dnp.dappnode.eth": "0.2.0"
    });
  });
});
