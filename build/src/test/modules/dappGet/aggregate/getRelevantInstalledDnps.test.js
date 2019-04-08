const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const semver = require("semver");

/**
 * Purpose of the test. Make sure it is able to pick up relevant installed DNPs
 *
 * REQ: 'nginx-proxy.dnp.dappnode.eth'
 * DEPS:
 * - 'web.dnp.dappnode.eth' => 'nginx-proxy.dnp.dappnode.eth'
 * - 'web.dnp.dappnode.eth' => 'letsencrypt-nginx.dnp.dappnode.eth'
 * - 'letsencrypt-nginx.dnp.dappnode.eth' => 'web.dnp.dappnode.eth'
 *
 * Should be able to return 'web.dnp.dappnode.eth' and 'letsencrypt-nginx.dnp.dappnode.eth'
 * Also should not crash due to a dependency loop
 */

const getRelevantInstalledDnps = proxyquire(
  "modules/dappGet/aggregate/getRelevantInstalledDnps",
  {}
);

describe("dappGet/aggregate/getRelevantInstalledDnps", () => {
  it("should get the relevant installed dnps from a defined example case", async () => {
    const dnpList = getDnpList();

    const relevantInstalledDnps = getRelevantInstalledDnps({
      requestedDnps: ["nginx-proxy.dnp.dappnode.eth"],
      installedDnps: dnpList.filter(pkg => semver.valid(pkg.version))
    });

    const resultPkgNames = relevantInstalledDnps;
    expect(resultPkgNames).to.deep.equal([
      {
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        name: "web.dnp.dappnode.eth",
        version: "0.0.0"
      },
      {
        dependencies: {
          "web.dnp.dappnode.eth": "latest"
        },
        name: "letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4"
      }
    ]);
  });
});

function getDnpList() {
  return [
    {
      dependencies: {
        "nginx-proxy.dnp.dappnode.eth": "latest",
        "letsencrypt-nginx.dnp.dappnode.eth": "latest"
      },
      name: "web.dnp.dappnode.eth",
      version: "0.0.0"
    },
    {
      dependencies: undefined,
      name: "vpn.dnp.dappnode.eth",
      version: "0.1.16"
    },
    {
      dependencies: undefined,
      name: "bind.dnp.dappnode.eth",
      version: "0.1.5"
    },
    {
      dependencies: undefined,
      name: "core.dnp.dappnode.eth",
      version: "0.1.7"
    },
    {
      dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" },
      name: "nginx-proxy.dnp.dappnode.eth",
      version: "0.0.3"
    },
    {
      dependencies: { "web.dnp.dappnode.eth": "latest" },
      name: "letsencrypt-nginx.dnp.dappnode.eth",
      version: "0.0.4"
    }
  ];
}
