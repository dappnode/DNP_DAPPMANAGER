import "mocha";
import { expect } from "chai";

import {
  getMyDotEthdomain,
  getDotDappnodeDomain,
  getNsupdateTxts
} from "../../../src/watchers/nsupdate/utils";
import { mockContainer } from "../../testUtils";
import { PackageContainer } from "../../../src/types";

describe("watcher > nsupdate", () => {
  describe("getMyDotEthdomain", () => {
    const cases: { [name: string]: string } = {
      "bitcoin.dnp.dappnode.eth": "my.bitcoin.dnp.dappnode.eth",
      "artis.public.dappnode.eth": "my.artis.public.dappnode.eth",
      "ln-network.dnp.dappnode.eth": "my.ln-network.dnp.dappnode.eth",
      "with_under.dnp.dappnode.eth": "my.withunder.dnp.dappnode.eth"
    };

    for (const [name, domain] of Object.entries(cases)) {
      it(`Should get the domain of ${name}`, () => {
        expect(getMyDotEthdomain(name)).to.equal(domain);
      });
    }
  });

  describe("getDotDappnodeDomain", () => {
    const cases: { [name: string]: string } = {
      "bitcoin.dnp.dappnode.eth": "bitcoin.dappnode",
      "artis.public.dappnode.eth": "artis.public.dappnode",
      "ln-network.dnp.dappnode.eth": "ln-network.dappnode",
      "with_under.dnp.dappnode.eth": "withunder.dappnode"
    };

    for (const [name, domain] of Object.entries(cases)) {
      it(`Should get the domain of ${name}`, () => {
        expect(getDotDappnodeDomain(name)).to.equal(domain);
      });
    }
  });

  /**
   * Util to reduce verbosity when asserting nsupdate texts
   * @param nsupdateTxts
   * @param expectedNsupdateTxts
   */
  function assertNsUpdateTxts(
    nsupdateTxts: string[],
    expectedNsupdateTxts: { eth: string; dappnode: string }
  ): void {
    expect(nsupdateTxts[0]).to.equal(
      `
server 172.33.1.2
debug yes
zone eth.
${expectedNsupdateTxts.eth.trim()}
show
send
    `.trim(),
      "Wrong eth zone"
    );
    expect(nsupdateTxts[1]).to.equal(
      `
server 172.33.1.2
debug yes
zone dappnode.
${expectedNsupdateTxts.dappnode.trim()}
show
send
    `.trim(),
      "Wrong dappnode zone"
    );
  }

  describe("getNsupdateTxts", () => {
    const bitcoinDnpName = "bitcoin.dnp.dappnode.eth";
    const gethDnpName = "geth.dnp.dappnode.eth";
    const pinnerDnpName = "pinner.dnp.dappnode.eth";
    const pinnerService1 = "cluster";
    const pinnerService2 = "app";
    const containers: PackageContainer[] = [
      {
        ...mockContainer,
        dnpName: bitcoinDnpName,
        serviceName: bitcoinDnpName,
        ip: "172.33.0.2"
      },
      {
        ...mockContainer,
        dnpName: gethDnpName,
        serviceName: gethDnpName,
        ip: "172.33.0.3",
        chain: "ethereum"
      },
      {
        ...mockContainer,
        dnpName: pinnerDnpName,
        serviceName: pinnerService1,
        ip: "172.33.0.4"
      },
      {
        ...mockContainer,
        dnpName: pinnerDnpName,
        serviceName: pinnerService2,
        ip: "172.33.0.5"
      }
    ];
    const domainAliases = {
      fullnode: gethDnpName
    };

    it("Should get nsupdate.txt contents for a normal case", () => {
      const nsupdateTxts = getNsupdateTxts({ containers, domainAliases });
      assertNsUpdateTxts(nsupdateTxts, {
        eth: `
update delete my.bitcoin.dnp.dappnode.eth A
update add my.bitcoin.dnp.dappnode.eth 60 A 172.33.0.2
update delete my.geth.dnp.dappnode.eth A
update add my.geth.dnp.dappnode.eth 60 A 172.33.0.3
update delete my.cluster.pinner.dnp.dappnode.eth A
update add my.cluster.pinner.dnp.dappnode.eth 60 A 172.33.0.4
update delete my.app.pinner.dnp.dappnode.eth A
update add my.app.pinner.dnp.dappnode.eth 60 A 172.33.0.5
`,
        dappnode: `
update delete bitcoin.dappnode A
update add bitcoin.dappnode 60 A 172.33.0.2
update delete geth.dappnode A
update add geth.dappnode 60 A 172.33.0.3
update delete cluster.pinner.dappnode A
update add cluster.pinner.dappnode 60 A 172.33.0.4
update delete app.pinner.dappnode A
update add app.pinner.dappnode 60 A 172.33.0.5
update delete fullnode.dappnode A
update add fullnode.dappnode 60 A 172.33.0.3
`
      });
    });

    it("Should get nsupdate.txt contents for remove only", () => {
      const nsupdateTxts = getNsupdateTxts({
        containers,
        domainAliases,
        removeOnly: true
      });

      assertNsUpdateTxts(nsupdateTxts, {
        eth: `
update delete my.bitcoin.dnp.dappnode.eth A
update delete my.geth.dnp.dappnode.eth A
update delete my.cluster.pinner.dnp.dappnode.eth A
update delete my.app.pinner.dnp.dappnode.eth A
`,
        dappnode: `
update delete bitcoin.dappnode A
update delete geth.dappnode A
update delete cluster.pinner.dappnode A
update delete app.pinner.dappnode A
update delete fullnode.dappnode A
`
      });
    });

    it("Should get nsupdate.txt contents for installing bitcoin", () => {
      const nsupdateTxts = getNsupdateTxts({
        containers,
        domainAliases,
        dnpNames: [bitcoinDnpName]
      });

      assertNsUpdateTxts(nsupdateTxts, {
        eth: `
update delete my.bitcoin.dnp.dappnode.eth A
update add my.bitcoin.dnp.dappnode.eth 60 A 172.33.0.2
`,
        dappnode: `
update delete bitcoin.dappnode A
update add bitcoin.dappnode 60 A 172.33.0.2
`
      });
    });

    it("Should get nsupdate.txt contents for a removing bitcoin", () => {
      const nsupdateTxts = getNsupdateTxts({
        containers,
        domainAliases,
        dnpNames: [bitcoinDnpName],
        removeOnly: true
      });

      assertNsUpdateTxts(nsupdateTxts, {
        eth: `
update delete my.bitcoin.dnp.dappnode.eth A`,
        dappnode: `
update delete bitcoin.dappnode A`
      });
    });
  });
});
