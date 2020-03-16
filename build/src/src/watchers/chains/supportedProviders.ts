export interface Chain {
  name: string;
  api: string;
  driverName: string;
}

export const supportedProviders: { [dnpName: string]: Chain } = {
  "ropsten.dnp.dappnode.eth": {
    name: "Ropsten",
    driverName: "ethereum",
    api: "http://my.ropsten.dnp.dappnode.eth:8545"
    //  api: 'ws://my.ropsten.dnp.dappnode.eth:8546',
  },
  "rinkeby.dnp.dappnode.eth": {
    name: "Rinkeby",
    driverName: "ethereum",
    api: "http://my.rinkeby.dnp.dappnode.eth:8545"
    //  api: 'ws://my.rinkeby.dnp.dappnode.eth:8546',
  },
  "kovan.dnp.dappnode.eth": {
    name: "Kovan",
    driverName: "ethereum",
    api: "http://my.kovan.dnp.dappnode.eth:8545"
    //  api: 'ws://my.kovan.dnp.dappnode.eth:8546',
  },
  "goerli-geth.dnp.dappnode.eth": {
    name: "Goerli-geth",
    driverName: "ethereum",
    api: "http://my.goerli-geth.dnp.dappnode.eth:8545"
  },
  "goerli-pantheon.dnp.dappnode.eth": {
    name: "Goerli-pantheon",
    driverName: "ethereum",
    api: "http://my.goerli-pantheon.dnp.dappnode.eth:8545"
  },
  "bitcoin.dnp.dappnode.eth": {
    name: "Bitcoin",
    driverName: "bitcoin",
    api: "my.bitcoin.dnp.dappnode.eth"
  },
  "monero.dnp.dappnode.eth": {
    name: "Monero",
    driverName: "monero",
    api: "http://my.monero.dnp.dappnode.eth:18081"
  }
};
