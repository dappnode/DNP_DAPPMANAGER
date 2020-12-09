import { Chain } from "./types";

export const knownChains: { [dnpName: string]: Chain } = {
  "openethereum.dnp.dappnode.eth": {
    dnpName: "openethereum.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://openethereum.dappnode:8545"
  },
  "ropsten.dnp.dappnode.eth": {
    dnpName: "ropsten.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://ropsten.dappnode:8545"
  },
  "rinkeby.dnp.dappnode.eth": {
    dnpName: "rinkeby.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://rinkeby.dappnode:8545"
  },
  "kovan.dnp.dappnode.eth": {
    dnpName: "kovan.dnp.dappnode.eth",
    driverName: "ethereum",
    api: "http://kovan.dappnode:8545"
  },
  "bitcoin.dnp.dappnode.eth": {
    dnpName: "bitcoin.dnp.dappnode.eth",
    driverName: "bitcoin",
    api: "bitcoin.dappnode"
  },
  "monero.dnp.dappnode.eth": {
    dnpName: "monero.dnp.dappnode.eth",
    driverName: "monero",
    api: "http://monero.dappnode:18081"
  },

  // New Eth2.0 chains
  "prysm.dnp.dappnode.eth": {
    dnpName: "prysm.dnp.dappnode.eth",
    driverName: "ethereum2-prysm",
    api: "http://beacon-chain.prysm.dappnode:3500"
  },
  "prysm-pyrmont.dnp.dappnode.eth": {
    dnpName: "prysm-pyrmont.dnp.dappnode.eth",
    driverName: "ethereum2-prysm",
    api: "http://beacon-chain.prysm-pyrmont.dappnode:3500"
  }
};
