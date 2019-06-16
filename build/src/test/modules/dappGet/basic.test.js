const proxyquire = require("proxyquire");
const expect = require("chai").expect;

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure dappGetBasic works
 * This is a lite version of the dappGet, specially though for core updates
 */

describe("dappGetBasic", () => {
  describe("Normal case", () => {
    const docker = {
      getDnps: async () => [
        { name: "core.dnp.dappnode.eth", version: "0.1.11" },
        { name: "dappmanager.dnp.dappnode.eth", version: "0.1.10" },
        { name: "admin.dnp.dappnode.eth", version: "0.1.6" },
        { name: "ethforward.dnp.dappnode.eth", version: "0.1.0" }
        //
      ]
    };
    const getManifest = async () => ({
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
    });
    const dappGet = proxyquire("modules/dappGet/basic", {
      "modules/getManifest": getManifest,
      "modules/docker": docker
    });

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

  describe("Special cases regarding x.y.z-alpha versions", () => {
    it("0.2.0-alpha => 0.2.0 - Should request to update all versions from alpha to 0.2.0", async () => {
      const docker = {
        getDnps: async () => [
          { name: "core.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "bind.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "ipfs.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "ethchain.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "ethforward.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "vpn.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "wamp.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "admin.dnp.dappnode.eth", version: "0.2.0-alpha" },
          { name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
          //
        ]
      };
      const getManifest = async () => ({
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
      });
      const dappGet = proxyquire("modules/dappGet/basic", {
        "modules/getManifest": getManifest,
        "modules/docker": docker
      });

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
      const docker = {
        getDnps: async () => [
          { name: "core.dnp.dappnode.eth", version: "0.2.0" },
          { name: "bind.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ipfs.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ethchain.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ethforward.dnp.dappnode.eth", version: "0.2.0" },
          { name: "vpn.dnp.dappnode.eth", version: "0.2.0" },
          { name: "wamp.dnp.dappnode.eth", version: "0.2.0" },
          { name: "admin.dnp.dappnode.eth", version: "0.2.0" },
          { name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
          //
        ]
      };
      const getManifest = async () => ({
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
      });
      const dappGet = proxyquire("modules/dappGet/basic", {
        "modules/getManifest": getManifest,
        "modules/docker": docker
      });

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
      const docker = {
        getDnps: async () => [
          { name: "core.dnp.dappnode.eth", version: "0.2.0" },
          { name: "bind.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ipfs.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ethchain.dnp.dappnode.eth", version: "0.2.0" },
          { name: "ethforward.dnp.dappnode.eth", version: "0.2.0" },
          { name: "vpn.dnp.dappnode.eth", version: "0.2.0" },
          { name: "wamp.dnp.dappnode.eth", version: "0.2.0" },
          { name: "admin.dnp.dappnode.eth", version: "0.2.0" },
          { name: "dappmanager.dnp.dappnode.eth", version: "0.2.0" }
          //
        ]
      };
      const getManifest = async () => ({
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
      });
      const dappGet = proxyquire("modules/dappGet/basic", {
        "modules/getManifest": getManifest,
        "modules/docker": docker
      });

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
      const docker = {
        getDnps: async () => [
          { name: "core.dnp.dappnode.eth", version: "0.1.11" },
          { name: "bind.dnp.dappnode.eth", version: "0.1.9" },
          { name: "ipfs.dnp.dappnode.eth", version: "0.1.6" },
          { name: "ethchain.dnp.dappnode.eth", version: "0.1.7" },
          { name: "ethforward.dnp.dappnode.eth", version: "0.1.2" },
          { name: "vpn.dnp.dappnode.eth", version: "0.1.12" },
          { name: "wamp.dnp.dappnode.eth", version: "0.1.1" },
          { name: "admin.dnp.dappnode.eth", version: "0.1.5" },
          { name: "dappmanager.dnp.dappnode.eth", version: "0.1.20" }
          //
        ]
      };
      const getManifest = async () => ({
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
      });
      const dappGet = proxyquire("modules/dappGet/basic", {
        "modules/getManifest": getManifest,
        "modules/docker": docker
      });

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
      const docker = {
        getDnps: async () => [
          { name: "core.dnp.dappnode.eth", version: "0.1.11" },
          { name: "bind.dnp.dappnode.eth", version: "0.1.9" },
          { name: "ipfs.dnp.dappnode.eth", version: "0.1.6" },
          { name: "ethchain.dnp.dappnode.eth", version: "0.1.7" },
          { name: "ethforward.dnp.dappnode.eth", version: "0.1.2" },
          { name: "vpn.dnp.dappnode.eth", version: "0.1.12" },
          { name: "wamp.dnp.dappnode.eth", version: "0.1.1" },
          { name: "admin.dnp.dappnode.eth", version: "0.1.5" },
          { name: "dappmanager.dnp.dappnode.eth", version: "0.1.20" }
          //
        ]
      };
      const getManifest = async () => ({
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
      });
      const dappGet = proxyquire("modules/dappGet/basic", {
        "modules/getManifest": getManifest,
        "modules/docker": docker
      });

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
