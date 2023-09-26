import { expect } from "chai";
import { getPrivateNetworkAlias, ContainerNames } from "../../src/domains.js";

describe("domains", () => {
  describe("getPrivateNetworkAlias", () => {
    const testCases: (ContainerNames & { domain: string })[] = [
      {
        dnpName: "prysm.dnp.dappnode.eth",
        serviceName: "validator",
        domain: "validator.prysm.dappnode"
      },
      {
        dnpName: "prysm.dnp.dappnode.eth",
        serviceName: "prysm.dnp.dappnode.eth",
        domain: "prysm.dappnode"
      },
      {
        dnpName: "prysm.public.dappnode.eth",
        serviceName: "validator",
        domain: "validator.prysm.public.dappnode"
      },
      {
        dnpName: "prysm.some.repo.eth",
        serviceName: "validator",
        domain: "validator.prysm.some.repo.dappnode"
      },
      {
        dnpName: "prysm.some.repo.io",
        serviceName: "validator",
        domain: "validator.prysm.some.repo.io.dappnode"
      }
    ];

    for (const { domain, serviceName, dnpName } of testCases) {
      it(`${serviceName} ${dnpName}`, () => {
        expect(getPrivateNetworkAlias({ dnpName, serviceName })).to.equal(
          domain
        );
      });
    }
  });
});
