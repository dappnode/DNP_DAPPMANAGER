import "mocha";
import { expect } from "chai";

import {
  getMyDotEthdomain,
  getDotDappnodeDomain,
  getNsupdateTxts
} from "../../../../src/modules/nsupdate/utils";
import { mockContainer } from "../../../testUtils";
import { PackageContainer } from "@dappnode/common";

describe("modules > nsupdate", () => {
  describe("getMyDotEthdomain", () => {
    const cases: { [name: string]: string } = {
      "ipfs.dnp.dappnode.eth": "my.ipfs.dnp.dappnode.eth",
      "bitcoin.dnp.dappnode.eth": "my.bitcoin.dnp.dappnode.eth",
      "artis.public.dappnode.eth": "my.artis.public.dappnode.eth",
      "ln-network.dnp.dappnode.eth": "my.ln-network.dnp.dappnode.eth",
      "with_under.dnp.dappnode.eth": "my.withunder.dnp.dappnode.eth",
      "service1.dappnodesdk.dnp.dappnode.eth":
        "my.service1.dappnodesdk.dnp.dappnode.eth"
    };

    for (const [name, domain] of Object.entries(cases)) {
      it(`Should get the domain of ${name}`, () => {
        expect(getMyDotEthdomain(name)).to.equal(domain);
      });
    }
  });

  describe("getDotDappnodeDomain", () => {
    const cases: { [name: string]: string } = {
      "ipfs.dnp.dappnode.eth": "ipfs.dappnode",
      "bitcoin.dnp.dappnode.eth": "bitcoin.dappnode",
      "artis.public.dappnode.eth": "artis.public.dappnode",
      "ln-network.dnp.dappnode.eth": "ln-network.dappnode",
      "with_under.dnp.dappnode.eth": "withunder.dappnode",
      "service1.dappnodesdk.dnp.dappnode.eth": "service1.dappnodesdk.dappnode"
    };

    for (const [name, domain] of Object.entries(cases)) {
      it(`Should get the domain of ${name}`, () => {
        expect(
          getDotDappnodeDomain({ dnpName: name, serviceName: name })
        ).to.equal(domain);
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
    const ipfsDnpName = "ipfs.dnp.dappnode.eth";
    const bitcoinDnpName = "bitcoin.dnp.dappnode.eth";
    const gethDnpName = "geth.dnp.dappnode.eth";
    const pinnerDnpName = "pinner.dnp.dappnode.eth";
    const pinnerService1 = "cluster";
    const pinnerService2 = "app";
    const containers: PackageContainer[] = [
      {
        ...mockContainer,
        dnpName: ipfsDnpName,
        serviceName: ipfsDnpName,
        ip: "172.33.1.5"
      },
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
update delete my.ipfs.dnp.dappnode.eth A
update add my.ipfs.dnp.dappnode.eth 60 A 172.33.1.5
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
update delete ipfs.dappnode A
update add ipfs.dappnode 60 A 172.33.1.5
update delete *.ipfs.dappnode A
update add *.ipfs.dappnode 60 A 172.33.1.5
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
update delete my.ipfs.dnp.dappnode.eth A
update delete my.bitcoin.dnp.dappnode.eth A
update delete my.geth.dnp.dappnode.eth A
update delete my.cluster.pinner.dnp.dappnode.eth A
update delete my.app.pinner.dnp.dappnode.eth A
`,
        dappnode: `
update delete ipfs.dappnode A
update delete *.ipfs.dappnode A
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

    it("Should add root domain to grafana container", () => {
      const grafanaContainer: PackageContainer = {
        ...mockContainer,
        canBeFullnode: false,
        containerId:
          "ba4765113dd6016da8b35dfe367493186f3bfd34d88eca03ccf894f7045710fa",
        containerName: "DAppNodePackage-grafana.dms.dnp.dappnode.eth",
        created: 1618303536,
        dnpName: "dms.dnp.dappnode.eth",
        exitCode: null,
        image: "grafana.dms.dnp.dappnode.eth:1.0.1",
        instanceName: "",
        ip: "172.33.0.3",
        isCore: false,
        isDnp: true,
        isMain: true,
        networks: [
          {
            ip: "172.33.0.3",
            name: "dncore_network"
          }
        ],

        running: true,
        serviceName: "grafana",
        state: "running"
      };

      const nsupdateTxts = getNsupdateTxts({
        containers: [grafanaContainer],
        domainAliases: {}
      });

      assertNsUpdateTxts(nsupdateTxts, {
        eth: `
update delete my.grafana.dms.dnp.dappnode.eth A
update add my.grafana.dms.dnp.dappnode.eth 60 A 172.33.0.3
update delete my.dms.dnp.dappnode.eth A
update add my.dms.dnp.dappnode.eth 60 A 172.33.0.3
  `,
        dappnode: `
update delete grafana.dms.dappnode A
update add grafana.dms.dappnode 60 A 172.33.0.3
update delete dms.dappnode A
update add dms.dappnode 60 A 172.33.0.3`
      });
    });
  });
});
