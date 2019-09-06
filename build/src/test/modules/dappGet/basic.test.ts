import "mocha";
import { expect } from "chai";
import { Manifest, PackageContainer, PackageRequest } from "../../../src/types";
import { mockManifest, mockDnp } from "../../testUtils";
import { ResultInterface } from "../../../src/modules/dappGet/types";
const proxyquire = require("proxyquire").noCallThru();

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure dappGetBasic works
 * This is a lite version of the dappGet, specially though for core updates
 */

function getDappBasic(
  containerList: PackageContainer[],
  manifest: Manifest
): (req: PackageRequest) => Promise<ResultInterface> {
  const { default: dappGet } = proxyquire(
    "../../../src/modules/dappGet/basic",
    {
      "../../modules/getManifest": async () => manifest,
      "../../modules/listContainers": async () => containerList
    }
  );
  return dappGet;
}

describe("dappGetBasic", () => {
  describe("Normal case", () => {
    const dappGet = getDappBasic(
      [
        { ...mockDnp, name: "core.dnp.dappnode.eth", version: "0.1.11" },
        { ...mockDnp, name: "dappmanager.dnp.dappnode.eth", version: "0.1.10" },
        { ...mockDnp, name: "admin.dnp.dappnode.eth", version: "0.1.6" },
        { ...mockDnp, name: "ethforward.dnp.dappnode.eth", version: "0.1.0" }
      ],
      {
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.1.15",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.1.4",
          "ipfs.dnp.dappnode.eth": "0.1.3",
          "ethchain.dnp.dappnode.eth": "0.1.4",
          "ethforward.dnp.dappnode.eth": "0.1.1",
          "vpn.dnp.dappnode.eth": "0.1.11",
          "wamp.dnp.dappnode.eth": "0.1.0",
          "admin.dnp.dappnode.eth": "0.1.6",
          "dappmanager.dnp.dappnode.eth": "0.1.10"
        }
      }
    );

    it("Should request only fetching first level dependencies, ignoring the already updated", async () => {
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
  });

  describe("0.2.0-alpha => 0.2.0", () => {
    const dappGet = getDappBasic(
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
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.2.0",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.2.0",
          "ipfs.dnp.dappnode.eth": "0.2.0",
          "ethchain.dnp.dappnode.eth": "0.2.0",
          "ethforward.dnp.dappnode.eth": "0.2.0",
          "vpn.dnp.dappnode.eth": "0.2.0",
          "wamp.dnp.dappnode.eth": "0.2.0",
          "admin.dnp.dappnode.eth": "0.2.0",
          "dappmanager.dnp.dappnode.eth": "0.2.0"
        }
      }
    );

    it("Should request to update all versions from alpha to 0.2.0", async () => {
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
  });

  describe("0.2.0 => 0.2.0", () => {
    const dappGet = getDappBasic(
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
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.2.0",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.2.0",
          "ipfs.dnp.dappnode.eth": "0.2.0",
          "ethchain.dnp.dappnode.eth": "0.2.0",
          "ethforward.dnp.dappnode.eth": "0.2.0",
          "vpn.dnp.dappnode.eth": "0.2.0",
          "wamp.dnp.dappnode.eth": "0.2.0",
          "admin.dnp.dappnode.eth": "0.2.0",
          "dappmanager.dnp.dappnode.eth": "0.2.0"
        }
      }
    );

    it("Should not update any", async () => {
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
  });

  describe("0.2.0 => 0.2.0-alpha", () => {
    const dappGet = getDappBasic(
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
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.2.0-alpha",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.2.0-alpha",
          "ipfs.dnp.dappnode.eth": "0.2.0-alpha",
          "ethchain.dnp.dappnode.eth": "0.2.0-alpha",
          "ethforward.dnp.dappnode.eth": "0.2.0-alpha",
          "vpn.dnp.dappnode.eth": "0.2.0-alpha",
          "wamp.dnp.dappnode.eth": "0.2.0-alpha",
          "admin.dnp.dappnode.eth": "0.2.0-alpha",
          "dappmanager.dnp.dappnode.eth": "0.2.0-alpha"
        }
      }
    );

    it("Should not update any", async () => {
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
  });

  describe("0.1.x => 0.2.0-alpha", () => {
    const dappGet = getDappBasic(
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
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.2.0-alpha",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.2.0-alpha",
          "ipfs.dnp.dappnode.eth": "0.2.0-alpha",
          "ethchain.dnp.dappnode.eth": "0.2.0-alpha",
          "ethforward.dnp.dappnode.eth": "0.2.0-alpha",
          "vpn.dnp.dappnode.eth": "0.2.0-alpha",
          "wamp.dnp.dappnode.eth": "0.2.0-alpha",
          "admin.dnp.dappnode.eth": "0.2.0-alpha",
          "dappmanager.dnp.dappnode.eth": "0.2.0-alpha"
        }
      }
    );

    it("Should update all to 0.2.0-alpha", async () => {
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
  });

  describe("0.1.x => 0.2.0", () => {
    const dappGet = getDappBasic(
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
        ...mockManifest,
        name: "core.dnp.dappnode.eth",
        version: "0.2.0",
        type: "dncore",
        dependencies: {
          "bind.dnp.dappnode.eth": "0.2.0",
          "ipfs.dnp.dappnode.eth": "0.2.0",
          "ethchain.dnp.dappnode.eth": "0.2.0",
          "ethforward.dnp.dappnode.eth": "0.2.0",
          "vpn.dnp.dappnode.eth": "0.2.0",
          "wamp.dnp.dappnode.eth": "0.2.0",
          "admin.dnp.dappnode.eth": "0.2.0",
          "dappmanager.dnp.dappnode.eth": "0.2.0"
        }
      }
    );

    it("Should update all to 0.2.0", async () => {
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
});
