import "mocha";
import { expect } from "chai";
import sinon from "sinon";
const proxyquire = require("proxyquire").noCallThru();

/**
 * Purpose of the test. Make sure aggregate fetches all necessary DNPs and info
 *
 * REQ: 'nginx-proxy.dnp.dappnode.eth'
 * DEPS:
 * - 'web.dnp.dappnode.eth' => 'nginx-proxy.dnp.dappnode.eth'
 * - 'web.dnp.dappnode.eth' => 'letsencrypt-nginx.dnp.dappnode.eth'
 * - 'letsencrypt-nginx.dnp.dappnode.eth' => 'web.dnp.dappnode.eth'
 *
 * > Should call aggregate without crashing
 * > Should call list containers once
 * > Should call aggregateDependencies in the correct order, for each package and version range
 *     For user request, the version range is the one set by the user
 *     For state packages, the version range is greater or equal than the current
 *     For state packages, if there is a specified origin, only fetch that
 * > Should aggregate labeled the packages correctly
 * > Also, should not crash due to a dependency loop
 */

const dnpList = [
  {
    dependencies: {
      "nginx-proxy.dnp.dappnode.eth": "latest",
      "letsencrypt-nginx.dnp.dappnode.eth": "latest"
    },
    name: "web.dnp.dappnode.eth",
    version: "0.0.0",
    origin: undefined
  },
  {
    dependencies: undefined,
    name: "vpn.dnp.dappnode.eth",
    version: "0.1.16",
    origin: undefined
  },
  {
    dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" },
    name: "nginx-proxy.dnp.dappnode.eth",
    version: "0.0.3",
    origin: undefined
  },
  {
    dependencies: { "web.dnp.dappnode.eth": "latest" },
    name: "letsencrypt-nginx.dnp.dappnode.eth",
    version: "0.0.4",
    origin: "/ipfs/Qm1234"
  }
];
const listContainers = sinon.stub().callsFake(async () => {
  return dnpList;
});

const aggregateDependencies = sinon.stub().callsFake(async ({ name, dnps }) => {
  if (name === "nginx-proxy.dnp.dappnode.eth") {
    dnps["nginx-proxy.dnp.dappnode.eth"] = {
      versions: {
        ...((dnps["nginx-proxy.dnp.dappnode.eth"] || {}).versions || {}),
        "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" }
      }
    };
    dnps["dependency.dnp.dappnode.eth"] = {
      versions: {
        ...((dnps["dependency.dnp.dappnode.eth"] || {}).versions || {}),
        "0.1.1": {},
        "0.1.2": {}
      }
    };
    return;
  }
  const dnp = dnpList.find(dnp => dnp.name === name);
  if (dnp) {
    dnps[dnp.name] = {
      versions: {
        ...((dnps[dnp.name] || {}).versions || {}),
        [dnp.version]: dnp.dependencies
      }
    };
  }
});

const getRelevantInstalledDnps = sinon.stub().callsFake(() => {
  const relevantInstalledDnpNames = [
    "web.dnp.dappnode.eth",
    "letsencrypt-nginx.dnp.dappnode.eth"
  ];
  return dnpList.filter(dnp => relevantInstalledDnpNames.includes(dnp.name));
});

const { default: aggregate } = proxyquire(
  "../../../../src/modules/dappGet/aggregate/index",
  {
    "./getRelevantInstalledDnps": getRelevantInstalledDnps,
    "./aggregateDependencies": aggregateDependencies,
    "../../../modules/docker/listContainers": listContainers
  }
);

describe("dappGet/aggregate", () => {
  it("Should label the packages correctly", async () => {
    const req = {
      name: "nginx-proxy.dnp.dappnode.eth",
      ver: "^0.1.0"
    };
    const dnps = await aggregate({ req });

    expect(dnps).to.deep.equal({
      "dependency.dnp.dappnode.eth": {
        versions: {
          "0.1.1": {},
          "0.1.2": {}
        }
      },
      "letsencrypt-nginx.dnp.dappnode.eth": {
        isInstalled: true,
        versions: {
          "0.0.4": {
            "web.dnp.dappnode.eth": "latest"
          }
        }
      },
      "nginx-proxy.dnp.dappnode.eth": {
        isRequest: true,
        versions: {
          "0.1.0": {
            "dependency.dnp.dappnode.eth": "^0.1.1"
          }
        }
      },
      "web.dnp.dappnode.eth": {
        isInstalled: true,
        versions: {
          "0.0.0": {
            "letsencrypt-nginx.dnp.dappnode.eth": "latest",
            "nginx-proxy.dnp.dappnode.eth": "latest"
          }
        }
      }
    });
  });

  it("Should call list containers once", () => {
    sinon.assert.calledOnce(listContainers);
  });

  it("Should call aggregateDependencies in the correct order, for each package and version range", () => {
    const dnpAggregateDependenciesCalls = [
      // For user request, the version range is the one set by the user
      { name: "nginx-proxy.dnp.dappnode.eth", versionRange: "^0.1.0" },
      // For state packages, the version range is greater or equal than the current
      { name: "web.dnp.dappnode.eth", versionRange: ">=0.0.0" },
      // For state packages, if there is a specified origin, only fetch that
      {
        name: "letsencrypt-nginx.dnp.dappnode.eth",
        versionRange: "/ipfs/Qm1234"
      }
    ];
    sinon.assert.callCount(
      aggregateDependencies,
      dnpAggregateDependenciesCalls.length
    );
    dnpAggregateDependenciesCalls.forEach((dnp, i) => {
      const { name, versionRange } = aggregateDependencies.getCall(i).args[0];
      expect(name).to.equal(
        dnp.name,
        `aggregateDependencies call ${i} should be for dnp name: "${dnp.name}"`
      );
      expect(versionRange).to.equal(
        dnp.versionRange,
        `aggregateDependencies call ${i} should be for dnp ${
          dnp.name
        } versionRange: "${dnp.versionRange}"`
      );
    });
  });
});
