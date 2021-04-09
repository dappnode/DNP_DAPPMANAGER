import { ExposableServiceInfo } from "../../../types";

export const exposablePredefined: {
  [dnpName: string]: ExposableServiceInfo[];
} = {
  "geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "geth",
      dnpName: "geth.dnp.dappnode.eth",
      serviceName: "geth.dnp.dappnode.eth",
      port: 8545,
      name: "Geth JSON RPC",
      description: "JSON RPC endpoint for Geth mainnet"
    }
  ],
  "geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "geth-ws",
      dnpName: "geth.dnp.dappnode.eth",
      serviceName: "geth.dnp.dappnode.eth",
      port: 8546,
      name: "Geth JSON RPC (WS)",
      description: "JSON RPC endpoint for Geth mainnet"
    }
  ],
  "goerli-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "goerli-geth",
      dnpName: "goerli-geth.dnp.dappnode.eth",
      serviceName: "goerli-geth.dnp.dappnode.eth",
      port: 8545,
      name: "Goerli Geth JSON RPC",
      description: "JSON RPC endpoint for Goerli network"
    }
  ],
  "goerli-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "goerli-geth-ws",
      dnpName: "goerli-geth.dnp.dappnode.eth",
      serviceName: "goerli-geth.dnp.dappnode.eth",
      port: 8546,
      name: "Goerli Geth JSON RPC (WS)",
      description: "JSON RPC endpoint for Goerli network"
    }
  ],
  "kovan.dnp.dappnode.eth": [
    {
      fromSubdomain: "kovan",
      dnpName: "kovan.dnp.dappnode.eth",
      serviceName: "kovan.dnp.dappnode.eth",
      port: 8545,
      name: "Kovan JSON RPC",
      description: "JSON RPC endpoint for Kovan network"
    }
  ],
  "kovan.dnp.dappnode.eth": [
    {
      fromSubdomain: "kovan-ws",
      dnpName: "kovan.dnp.dappnode.eth",
      serviceName: "kovan.dnp.dappnode.eth",
      port: 8546,
      name: "Kovan JSON RPC (WS)",
      description: "JSON RPC endpoint for Kovan network"
    }
  ],
  "nethermind.dnp.dappnode.eth": [
  {
    fromSubdomain: "nethermind",
    dnpName: "nethermind.public.dappnode.eth",
    serviceName: "nethermind.public.dappnode.eth",
    port: 8545,
    name: "Nethermind JSON RPC",
    description: "JSON RPC endpoint for Ethereum 1.0 mainnet"
  }
  ],
  "nethermind.dnp.dappnode.eth": [
    {
      fromSubdomain: "nethermind-ws",
      dnpName: "nethermind.public.dappnode.eth",
      serviceName: "nethermind.public.dappnode.eth",
      port: 8546,
      name: "Nethermind JSON RPC (WS)",
      description: "JSON RPC endpoint for Ethereum 1.0 mainnet"
    }
    ],
  "rinkeby.dnp.dappnode.eth": [
    {
      fromSubdomain: "rinkeby",
      dnpName: "rinkeby.dnp.dappnode.eth",
      serviceName: "rinkeby.dnp.dappnode.eth",
      port: 8545,
      name: "Rinkeby JSON RPC",
      description: "JSON RPC endpoint for Rinkeby network"
    }
  ],
  "rinkeby.dnp.dappnode.eth": [
    {
      fromSubdomain: "rinkeby-ws",
      dnpName: "rinkeby.dnp.dappnode.eth",
      serviceName: "rinkeby.dnp.dappnode.eth",
      port: 8546,
      name: "Rinkeby JSON RPC (WS)",
      description: "JSON RPC endpoint for Rinkeby network"
    }
  ],
  "ropsten.dnp.dappnode.eth": [
    {
      fromSubdomain: "ropsten",
      dnpName: "ropsten.dnp.dappnode.eth",
      serviceName: "ropsten.dnp.dappnode.eth",
      port: 8545,
      name: "Ropsten JSON RPC",
      description: "JSON RPC endpoint for Ropsten network"
    }
  ],
  "ropsten.dnp.dappnode.eth": [
    {
      fromSubdomain: "ropsten-ws",
      dnpName: "ropsten.dnp.dappnode.eth",
      serviceName: "ropsten.dnp.dappnode.eth",
      port: 8546,
      name: "Ropsten JSON RPC (WS)",
      description: "JSON RPC endpoint for Ropsten network"
    }
  ],
  "avalanche.public.dappnode.eth": [
    {
      fromSubdomain: "avalanche-public",
      dnpName: "avalanche.public.dappnode.eth",
      serviceName: "wallet",
      port: 80,
      name: "Ropsten JSON RPC",
      description: "JSON RPC endpoint for Ropsten network"
    }
  ],
  "bee.dnp.dappnode.eth": [
    {
      fromSubdomain: "bee",
      dnpName: "bee.dnp.dappnode.eth",
      serviceName: "bee.dnp.dappnode.eth",
      port: 1633,
      name: "Bee http API endpoint",
      description: "JSON http endpoint for bee"
    }
  ],
  "bitcoin.dnp.dappnode.eth": [
    {
      fromSubdomain: "bitcoin",
      dnpName: "bitcoin.dnp.dappnode.eth",
      serviceName: "bitcoin.dnp.dappnode.eth",
      port: 8332,
      name: "Bitcoin JSON RPC endpoint",
      description: "JSON endpoint for Bitcoin"
    }
  ],
  "monero.dnp.dappnode.eth": [
    {
      fromSubdomain: "monero",
      dnpName: "monero.dnp.dappnode.eth",
      serviceName: "monero.dnp.dappnode.eth",
      port: 18082,
      name: "Monero JSON RPC endpoint",
      description: "JSON endpoint for Bitcoin"
    }
  ],
  "zcash.public.dappnode.eth": [
    {
      fromSubdomain: "zcash",
      dnpName: "zcash.public.dappnode.eth",
      serviceName: "zcash.public.dappnode.eth",
      port: 8232,
      name: "Zcash JSON RPC endpoint",
      description: "JSON endpoint for Zcash"
    }
  ],
  "owncloud.public.dappnode.eth": [
    {
      fromSubdomain: "owncloud",
      dnpName: "owncloud.dnp.dappnode.eth",
      serviceName: "owncloud",
      port: 80,
      name: "Owncloud UI endpoint",
      description: "Owncloud UI endpoint"
    }
  ],
  "trustlines.dnp.dappnode.eth": [
    {
      fromSubdomain: "trustlines",
      dnpName: "trustlines.dnp.dappnode.eth",
      serviceName: "node",
      port: 8545,
      name: "Truslines JSON RPC ",
      description: "Truslines JSON RPC"
    }
  ],
  "trustlines.dnp.dappnode.eth": [
    {
      fromSubdomain: "trustlines",
      dnpName: "trustlines.dnp.dappnode.eth",
      serviceName: "node",
      port: 8545,
      name: "Truslines JSON RPC (WS)",
      description: "Truslines JSON RPC"
    }
  ],
  "turbo-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "turbo-geth",
      dnpName: "turbo-geth.dnp.dappnode.eth",
      serviceName: "rpcdaemon",
      port: 8545,
      name: "Turbo-geth JSON RPC",
      description: "Turbo-geth JSON RPC"
    }
  ],
  "turbo-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "turbo-geth-ws",
      dnpName: "turbo-geth.dnp.dappnode.eth",
      serviceName: "rpcdaemon",
      port: 8545,
      name: "Turbo-geth JSON RPC (WS)",
      description: "Turbo-geth JSON RPC"
    }
  ],
};

