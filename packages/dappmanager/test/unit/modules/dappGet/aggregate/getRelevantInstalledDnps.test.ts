import "mocha";
import { expect } from "chai";
import semver from "semver";
import { mockDnp, mockContainer } from "../../../../testUtils";
import getRelevantInstalledDnps from "../../../../../src/modules/dappGet/aggregate/getRelevantInstalledDnps";
import { InstalledPackageData } from "@dappnode/common";

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

describe("dappGet/aggregate/getRelevantInstalledDnps", () => {
  it("Should pick a dependant dnp", () => {
    const relevantPkg: InstalledPackageData = {
      ...mockDnp,
      version: "0.1.0",
      dnpName: "dnp-b.eth",
      dependencies: { "dnp-c.eth": "0.1.0" }
    };
    const dnpList: InstalledPackageData[] = [
      relevantPkg,
      {
        ...mockDnp,
        version: "0.1.0",
        dnpName: "dnp-c.eth",
        containers: [
          {
            ...mockContainer,
            containerId: "17628371823"
          }
        ]
      }
    ];

    const relevantInstalledDnps = getRelevantInstalledDnps({
      requestedDnps: ["dnp-a.eth", "dnp-c.eth"],
      installedDnps: dnpList
    });

    expect(relevantInstalledDnps).to.deep.equal([relevantPkg]);
  });

  it("should get the relevant installed dnps from a defined example case", async () => {
    const dnpList: InstalledPackageData[] = [
      {
        ...mockDnp,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        dnpName: "web.dnp.dappnode.eth",
        version: "0.0.0"
      },
      {
        ...mockDnp,
        dnpName: "vpn.dnp.dappnode.eth",
        version: "0.1.16"
      },
      {
        ...mockDnp,
        dnpName: "bind.dnp.dappnode.eth",
        version: "0.1.5"
      },
      {
        ...mockDnp,
        dnpName: "core.dnp.dappnode.eth",
        version: "0.1.7"
      },
      {
        ...mockDnp,
        dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" },
        dnpName: "nginx-proxy.dnp.dappnode.eth",
        version: "0.0.3"
      },
      {
        ...mockDnp,
        dependencies: { "web.dnp.dappnode.eth": "latest" },
        dnpName: "letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4"
      }
    ];

    const expectedRelevantInstalledDnps: InstalledPackageData[] = [
      {
        ...mockDnp,
        dependencies: {
          "nginx-proxy.dnp.dappnode.eth": "latest",
          "letsencrypt-nginx.dnp.dappnode.eth": "latest"
        },
        dnpName: "web.dnp.dappnode.eth",
        version: "0.0.0"
      },
      {
        ...mockDnp,
        dependencies: {
          "web.dnp.dappnode.eth": "latest"
        },
        dnpName: "letsencrypt-nginx.dnp.dappnode.eth",
        version: "0.0.4"
      }
    ];

    const relevantInstalledDnps = getRelevantInstalledDnps({
      requestedDnps: ["nginx-proxy.dnp.dappnode.eth"],
      installedDnps: dnpList.filter(pkg => semver.valid(pkg.version))
    });

    expect(relevantInstalledDnps).to.deep.equal(expectedRelevantInstalledDnps);
  });
});
