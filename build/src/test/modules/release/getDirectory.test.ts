import "mocha";
import { expect } from "chai";
import { sortDirectoryItems } from "../../../src/modules/release/getDirectory";
import { DirectoryDnp } from "../../../src/types";

describe("getDirectory", () => {
  it("Should order directory packages", () => {
    const packages: DirectoryDnp[] = [
      {
        name: "kovan.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 1000,
        directoryId: 0,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "artis-sigma1.public.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 2000,
        directoryId: 1,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "monero.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 3000,
        directoryId: 2,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "vipnode.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 4000,
        directoryId: 3,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "ropsten.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 5000,
        directoryId: 4,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "rinkeby.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 6000,
        directoryId: 5,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "lightning-network.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 7000,
        directoryId: 6,
        isFeatured: true,
        featuredIndex: 2
      },
      {
        name: "swarm.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 8000,
        directoryId: 7,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "goerli-geth.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 9000,
        directoryId: 8,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "bitcoin.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 10000,
        directoryId: 9,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "raiden-testnet.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 11000,
        directoryId: 10,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "raiden.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 12000,
        directoryId: 11,
        isFeatured: true,
        featuredIndex: 0
      },
      {
        name: "cosmos.public.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 13000,
        directoryId: 12,
        isFeatured: true,
        featuredIndex: 1
      },
      {
        name: "geth.dnp.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 14000,
        directoryId: 13,
        isFeatured: false,
        featuredIndex: -1
      },
      {
        name: "zcash.public.dappnode.eth",
        status: 1,
        statusName: "Active",
        position: 16000,
        directoryId: 15,
        isFeatured: false,
        featuredIndex: -1
      }
    ];

    const correctNameOrder: string[] = [
      "raiden.dnp.dappnode.eth",
      "cosmos.public.dappnode.eth",
      "lightning-network.dnp.dappnode.eth",
      "zcash.public.dappnode.eth",
      "geth.dnp.dappnode.eth",
      "raiden-testnet.dnp.dappnode.eth",
      "bitcoin.dnp.dappnode.eth",
      "goerli-geth.dnp.dappnode.eth",
      "swarm.dnp.dappnode.eth",
      "rinkeby.dnp.dappnode.eth",
      "ropsten.dnp.dappnode.eth",
      "vipnode.dnp.dappnode.eth",
      "monero.dnp.dappnode.eth",
      "artis-sigma1.public.dappnode.eth",
      "kovan.dnp.dappnode.eth"
    ];

    const orderedPackages = sortDirectoryItems(packages);

    expect(orderedPackages.map(({ name }) => name)).to.deep.equal(
      correctNameOrder
    );
  });
});
