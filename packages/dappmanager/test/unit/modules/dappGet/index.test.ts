import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock/webpack";
// Import for types
import dappGetType from "../../../../src/modules/dappGet";
import { InstalledPackageData } from "@dappnode/common";
import { mockDnp } from "../../../testUtils";
import { DappGetDnps } from "../../../../src/modules/dappGet/types";
import { DappGetFetcher } from "../../../../src/modules/dappGet/fetch";

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure packages are moved to the alreadyUpgraded object
 */

describe.skip("dappGet", function () {
  this.timeout(5 * 1000); // For some reason the before step can last > 2s
  const listPackagesSpy = sinon.spy();

  let dappGet: typeof dappGetType;

  before("Mock", async () => {
    async function listPackages(): Promise<InstalledPackageData[]> {
      listPackagesSpy();
      return [
        {
          ...mockDnp,
          dependencies: {
            "nginx-proxy.dnp.dappnode.eth": "latest",
            "letsencrypt-nginx.dnp.dappnode.eth": "latest"
          },
          dnpName: "web.dnp.dappnode.eth",
          version: "0.1.0",
          origin: undefined
        },
        {
          ...mockDnp,
          dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" },
          dnpName: "nginx-proxy.dnp.dappnode.eth",
          version: "0.0.3",
          origin: undefined
        },
        {
          ...mockDnp,
          dependencies: { "web.dnp.dappnode.eth": "latest" },
          dnpName: "letsencrypt-nginx.dnp.dappnode.eth",
          version: "0.0.4",
          origin: "/ipfs/Qm1234"
        }
      ];
    }

    async function aggregate(): Promise<DappGetDnps> {
      return {};
    }

    // IDE and rewiremock can figure out the type on their own
    /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
    function resolve() {
      return {
        success: true,
        message: "Found compatible state",
        state: {
          "nginx-proxy.dnp.dappnode.eth": "0.0.4",
          "letsencrypt-nginx.dnp.dappnode.eth": "0.0.4",
          "web.dnp.dappnode.eth": "0.1.0"
        }
      };
    }

    const mock = await rewiremock.around(
      () => import("../../../../src/modules/dappGet"),
      mock => {
        mock(() => import("../../../../src/modules/dappGet/aggregate"))
          .withDefault(aggregate)
          .toBeUsed();
        mock(() => import("../../../../src/modules/dappGet/resolve"))
          .withDefault(resolve)
          .toBeUsed();
        mock(() => import("../../../../src/modules/docker/list"))
          .with({ listPackages })
          .toBeUsed();
      }
    );
    dappGet = mock.default;
  });

  it("Should add packages to the alreadyUpdated object", async () => {
    const dappGetOptions = {};
    const dappGetFetcher = new DappGetFetcher();
    const { state, alreadyUpdated } = await dappGet(
      {
        name: "nginx-proxy.dnp.dappnode.eth",
        ver: "^0.1.0"
      },
      dappGetOptions,
      dappGetFetcher
    );

    expect(state).to.deep.equal({
      "nginx-proxy.dnp.dappnode.eth": "0.0.4"
    });
    expect(alreadyUpdated).to.deep.equal({
      "letsencrypt-nginx.dnp.dappnode.eth": "0.0.4",
      "web.dnp.dappnode.eth": "0.1.0"
    });
  });

  it("Should call list containers once", () => {
    sinon.assert.calledOnce(listPackagesSpy);
  });
});
