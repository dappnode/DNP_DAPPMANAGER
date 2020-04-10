import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock";
import { DappGetFetcherMock } from "../testHelpers";

// Import for types
import aggregateType from "../../../../src/modules/dappGet/aggregate/index";
import { PackageContainer } from "../../../../src/types";
import { mockDnp } from "../../../testUtils";
import { DappGetDnps } from "../../../../src/modules/dappGet/types";

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

const nginxId = "nginx-proxy.dnp.dappnode.eth";
const depId = "dependency.dnp.dappnode.eth";

const dnpList: PackageContainer[] = [
  {
    ...mockDnp,
    dependencies: {
      [nginxId]: "latest",
      "letsencrypt-nginx.dnp.dappnode.eth": "latest"
    },
    name: "web.dnp.dappnode.eth",
    version: "0.0.0",
    origin: undefined
  },
  {
    ...mockDnp,
    dependencies: {},
    name: "vpn.dnp.dappnode.eth",
    version: "0.1.16",
    origin: undefined
  },
  {
    ...mockDnp,
    dependencies: { [nginxId]: "latest" },
    name: nginxId,
    version: "0.0.3",
    origin: undefined
  },
  {
    ...mockDnp,
    dependencies: { "web.dnp.dappnode.eth": "latest" },
    name: "letsencrypt-nginx.dnp.dappnode.eth",
    version: "0.0.4",
    origin: "/ipfs/Qm1234"
  }
];

const aggregateDependenciesSpy = sinon.spy();
async function aggregateDependencies({
  name,
  versionRange,
  dnps
}: {
  name: string;
  versionRange: string;
  dnps: DappGetDnps;
}): Promise<void> {
  aggregateDependenciesSpy({ name, versionRange, dnps });
  if (name === nginxId) {
    dnps[nginxId] = {
      versions: {
        ...(dnps[nginxId] ? dnps[nginxId].versions || {} : {}),
        "0.1.0": { [depId]: "^0.1.1" }
      }
    };
    dnps[depId] = {
      versions: {
        ...(dnps[depId] ? dnps[depId].versions || {} : {}),
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
        ...(dnps[dnp.name] ? dnps[dnp.name].versions || {} : {}),
        [dnp.version]: dnp.dependencies
      }
    };
  }
}

function getRelevantInstalledDnps(): PackageContainer[] {
  const relevantInstalledDnpNames = [
    "web.dnp.dappnode.eth",
    "letsencrypt-nginx.dnp.dappnode.eth"
  ];
  return dnpList.filter(dnp => relevantInstalledDnpNames.includes(dnp.name));
}

const dappGetFetcherEmpty = new DappGetFetcherMock({});

describe("dappGet/aggregate", () => {
  let aggregate: typeof aggregateType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../../src/modules/dappGet/aggregate/index"),
      mock => {
        mock(() =>
          import(
            "../../../../src/modules/dappGet/aggregate/getRelevantInstalledDnps"
          )
        )
          .withDefault(getRelevantInstalledDnps)
          .toBeUsed();
        mock(() =>
          import(
            "../../../../src/modules/dappGet/aggregate/aggregateDependencies"
          )
        )
          .withDefault(aggregateDependencies)
          .toBeUsed();
      }
    );
    aggregate = mock.default;
  });

  it("Should label the packages correctly", async () => {
    const req = {
      name: nginxId,
      ver: "^0.1.0"
    };
    const dnps = await aggregate({
      req,
      dnpList,
      dappGetFetcher: dappGetFetcherEmpty
    });

    expect(dnps).to.deep.equal(
      {
        [depId]: {
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
        [nginxId]: {
          isRequest: true,
          versions: {
            "0.1.0": {
              [depId]: "^0.1.1"
            }
          }
        },
        "web.dnp.dappnode.eth": {
          isInstalled: true,
          versions: {
            "0.0.0": {
              "letsencrypt-nginx.dnp.dappnode.eth": "latest",
              [nginxId]: "latest"
            }
          }
        }
      },
      "Should label the packages correctly"
    );

    const dnpAggregateDependenciesCalls = [
      // For user request, the version range is the one set by the user
      { name: nginxId, versionRange: "^0.1.0" },
      // For state packages, the version range is greater or equal than the current
      { name: "web.dnp.dappnode.eth", versionRange: ">=0.0.0" }
      // For state packages, if there is a specified origin, use cached local dependencies
      // {
      //   name: "letsencrypt-nginx.dnp.dappnode.eth",
      //   versionRange: "/ipfs/Qm1234"
      // }
    ];
    sinon.assert.callCount(
      aggregateDependenciesSpy,
      dnpAggregateDependenciesCalls.length
    );

    dnpAggregateDependenciesCalls.forEach((callArgs, i) => {
      const { name, versionRange } = aggregateDependenciesSpy.getCall(
        i
      ).lastArg;
      expect({ name, versionRange }).to.deep.equal(
        callArgs,
        `Wrong arguments for call ${i} to aggregateDependencies`
      );
    });
  });
});
