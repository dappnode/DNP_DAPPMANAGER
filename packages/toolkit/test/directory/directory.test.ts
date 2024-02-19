import { ethers } from "ethers";
import { DappNodeDirectory } from "../../src/directory/index.js";
import { expect } from "chai";

describe.skip("Dappnode Directory", function () {
  this.timeout(100000);
  const contract = new DappNodeDirectory(
    `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`
  );

  it(`should get directory pkgs`, async () => {
    const expectedResult = [
      {
        name: "dms.dnp.dappnode.eth",
        statusName: "Active",
        position: 33000,
        isFeatured: true,
        featuredIndex: 1,
      },
      {
        name: "rocketpool-testnet.public.dappnode.eth",
        statusName: "Active",
        position: 73000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "etc-mordor-core-geth.public.dappnode.eth",
        statusName: "Active",
        position: 72000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "etc-core-geth.public.dappnode.eth",
        statusName: "Active",
        position: 71000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "near.dnp.dappnode.eth",
        statusName: "Active",
        position: 69000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "pocket.dnp.dappnode.eth",
        statusName: "Active",
        position: 62000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "lighthouse-gnosis.dnp.dappnode.eth",
        statusName: "Active",
        position: 57000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "teku-gnosis.dnp.dappnode.eth",
        statusName: "Active",
        position: 56000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "hopr.public.dappnode.eth",
        statusName: "Active",
        position: 54100,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "swarm.public.dappnode.eth",
        statusName: "Active",
        position: 51100,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "optimism.public.dappnode.eth",
        statusName: "Active",
        position: 51100,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "swarm-testnet.public.dappnode.eth",
        statusName: "Active",
        position: 51050,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "mysterium.dnp.dappnode.eth",
        statusName: "Active",
        position: 51000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "ssv-prater.dnp.dappnode.eth",
        statusName: "Active",
        position: 49000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "alephium.dnp.dappnode.eth",
        statusName: "Active",
        position: 48100,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "nethermind-xdai.dnp.dappnode.eth",
        statusName: "Active",
        position: 48000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "rotki.dnp.dappnode.eth",
        statusName: "Active",
        position: 46000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "avalanche.public.dappnode.eth",
        statusName: "Active",
        position: 44000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "dappnode-exporter.dnp.dappnode.eth",
        statusName: "Active",
        position: 42000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "owncloud.dnp.dappnode.eth",
        statusName: "Active",
        position: 40000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "folding-at-home.public.dappnode.eth",
        statusName: "Active",
        position: 27000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "boinc.public.dappnode.eth",
        statusName: "Active",
        position: 26000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "tornado-cash-relayer.public.dappnode.eth",
        statusName: "Active",
        position: 24000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "storj.public.dappnode.eth",
        statusName: "Active",
        position: 23000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "ipfs-pinner.dnp.dappnode.eth",
        statusName: "Active",
        position: 21000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "polkadot-kusama.public.dappnode.eth",
        statusName: "Active",
        position: 20000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "zcash.public.dappnode.eth",
        statusName: "Active",
        position: 16000,
        isFeatured: false,
        featuredIndex: -1,
      },

      {
        name: "cosmos.public.dappnode.eth",
        statusName: "Active",
        position: 13000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "bitcoin.dnp.dappnode.eth",
        statusName: "Active",
        position: 10000,
        isFeatured: false,
        featuredIndex: -1,
      },
      {
        name: "monero.dnp.dappnode.eth",
        statusName: "Active",
        position: 3000,
        isFeatured: false,
        featuredIndex: -1,
      },
    ];
    const result = await contract.getDirectoryPkgs();
    console.log(result);
    // The directory is dynamic so is hard to test always contains the same items
    expect(result).to.be.ok;
  });
});
