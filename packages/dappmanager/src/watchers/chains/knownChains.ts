import { Chain } from "./types";

export const knownChains: { [dnpName: string]: Chain } = {
  "openethereum.dnp.dappnode.eth": {
    dnpName: "openethereum.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://my.openethereum.dnp.dappnode.eth:8545"
  },
  "ropsten.dnp.dappnode.eth": {
    dnpName: "ropsten.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://my.ropsten.dnp.dappnode.eth:8545"
  },
  "rinkeby.dnp.dappnode.eth": {
    dnpName: "rinkeby.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://my.rinkeby.dnp.dappnode.eth:8545"
  },
  "kovan.dnp.dappnode.eth": {
    dnpName: "kovan.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://my.kovan.dnp.dappnode.eth:8545"
  },
  "bitcoin.dnp.dappnode.eth": {
    dnpName: "bitcoin.dnp.dappnode.eth",
    driverName: "bitcoin",
    api: "my.bitcoin.dnp.dappnode.eth"
  },
  "monero.dnp.dappnode.eth": {
    dnpName: "monero.dnp.dappnode.eth",
    driverName: "monero",
    api: "http://my.monero.dnp.dappnode.eth:18081"
  },

  // New Eth2.0 chains
  "prysm.dnp.dappnode.eth": {
    dnpName: "prysm.dnp.dappnode.eth",
    driverName: "ethereum2-prysm",
    api: "http://my.prysm.dnp.dappnode.eth:3500"
  },
  "prysm-pyrmont.dnp.dappnode.eth": {
    dnpName: "prysm-pyrmont.dnp.dappnode.eth",
    driverName: "ethereum2-prysm",
    api: "http://my.prysm-pyrmont.dnp.dappnode.eth:3500"
  }
};
