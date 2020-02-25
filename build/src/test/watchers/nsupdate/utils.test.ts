import "mocha";
import { expect } from "chai";

import {
  getMyDotEthdomain,
  getDotDappnodeDomain,
  getNsupdateTxts
} from "../../../src/watchers/nsupdate/utils";
import { mockDnp } from "../../testUtils";
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

  describe("getNsupdateTxts", () => {
    const bitcoinDnpName = "bitcoin.dnp.dappnode.eth";
    const gethDnpName = "geth.dnp.dappnode.eth";
    const dnpList: PackageContainer[] = [
      {
        ...mockDnp,
        name: bitcoinDnpName,
        ip: "172.33.0.2"
      },
      {
        ...mockDnp,
        name: gethDnpName,
        ip: "172.33.0.3",
        domainAlias: ["fullnode"],
        chain: "ethereum"
      }
    ];

    it("Should get nsupdate.txt contents for a normal case", () => {
      const nsupdateTxts = getNsupdateTxts({ dnpList });
      expect(nsupdateTxts).to.deep.equal([
        `
server 172.33.1.2
debug yes
zone eth.
update delete my.bitcoin.dnp.dappnode.eth A
update add my.bitcoin.dnp.dappnode.eth 60 A 172.33.0.2
update delete my.geth.dnp.dappnode.eth A
update add my.geth.dnp.dappnode.eth 60 A 172.33.0.3
show
send
`.trim(),
        `
server 172.33.1.2
debug yes
zone dappnode.
update delete bitcoin.dappnode A
update add bitcoin.dappnode 60 A 172.33.0.2
update delete geth.dappnode A
update add geth.dappnode 60 A 172.33.0.3
update delete fullnode.dappnode A
update add fullnode.dappnode 60 A 172.33.0.3
show
send
`.trim()
      ]);
    });

    it("Should get nsupdate.txt contents for remove only", () => {
      const nsupdateTxts = getNsupdateTxts({ dnpList, removeOnly: true });
      expect(nsupdateTxts).to.deep.equal([
        `
server 172.33.1.2
debug yes
zone eth.
update delete my.bitcoin.dnp.dappnode.eth A
update delete my.geth.dnp.dappnode.eth A
show
send
`.trim(),
        `
server 172.33.1.2
debug yes
zone dappnode.
update delete bitcoin.dappnode A
update delete geth.dappnode A
update delete fullnode.dappnode A
show
send
`.trim()
      ]);
    });

    it("Should get nsupdate.txt contents for installing bitcoin", () => {
      const nsupdateTxts = getNsupdateTxts({
        dnpList,
        ids: [bitcoinDnpName]
      });
      expect(nsupdateTxts).to.deep.equal([
        `
server 172.33.1.2
debug yes
zone eth.
update delete my.bitcoin.dnp.dappnode.eth A
update add my.bitcoin.dnp.dappnode.eth 60 A 172.33.0.2
show
send
`.trim(),
        `
server 172.33.1.2
debug yes
zone dappnode.
update delete bitcoin.dappnode A
update add bitcoin.dappnode 60 A 172.33.0.2
show
send
`.trim()
      ]);
    });

    it("Should get nsupdate.txt contents for a removing bitcoin", () => {
      const nsupdateTxts = getNsupdateTxts({
        dnpList,
        ids: [bitcoinDnpName],
        removeOnly: true
      });
      expect(nsupdateTxts).to.deep.equal([
        `
server 172.33.1.2
debug yes
zone eth.
update delete my.bitcoin.dnp.dappnode.eth A
show
send
`.trim(),
        `
server 172.33.1.2
debug yes
zone dappnode.
update delete bitcoin.dappnode A
show
send
`.trim()
      ]);
    });
  });
});
