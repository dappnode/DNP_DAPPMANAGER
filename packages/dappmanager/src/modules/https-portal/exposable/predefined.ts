import { ExposableServiceInfo } from "../../../types";

export const exposablePredefined: {
  [dnpName: string]: ExposableServiceInfo[];
} = {
  "geth.dnp.dappnode.eth": [
    {
      dnpName: "geth.dnp.dappnode.eth",
      serviceName: "geth.dnp.dappnode.eth",
      port: 8545,
      name: "Geth JSON RPC",
      description: "JSON RPC endpoint for Geth mainnet"
    }
  ],
  "goerli-geth.dnp.dappnode.eth": [
    {
      dnpName: "goerli-geth.dnp.dappnode.eth",
      serviceName: "goerli-geth.dnp.dappnode.eth",
      port: 8545,
      name: "Goerli Geth JSON RPC",
      description: "JSON RPC endpoint for Goerli network"
    }
  ],
  "kovan.dnp.dappnode.eth": [
    {
      dnpName: "kovan.dnp.dappnode.eth",
      serviceName: "kovan.dnp.dappnode.eth",
      port: 8545,
      name: "Kovan JSON RPC",
      description: "JSON RPC endpoint for Kovan network"
    }
  ],
  "nethermind.dnp.dappnode.eth": [
  {
    dnpName: "nethermind.public.dappnode.eth",
    serviceName: "nethermind.public.dappnode.eth",
    port: 8545,
    name: "Nethermind JSON RPC",
    description: "JSON RPC endpoint for Ethereum 1.0 mainnet"
  }
  ],
  "rinkeby.dnp.dappnode.eth": [
    {
      dnpName: "rinkeby.dnp.dappnode.eth",
      serviceName: "rinkeby.dnp.dappnode.eth",
      port: 8545,
      name: "Rinkeby JSON RPC",
      description: "JSON RPC endpoint for Rinkeby network"
    }
  ],
  "ropsten.dnp.dappnode.eth": [
    {
      dnpName: "ropsten.dnp.dappnode.eth",
      serviceName: "ropsten.dnp.dappnode.eth",
      port: 8545,
      name: "Ropsten JSON RPC",
      description: "JSON RPC endpoint for Ropsten network"
    }
  ],
  "avalanche.public.dappnode.eth": [
    {
      dnpName: "avalanche.public.dappnode.eth",
      serviceName: "wallet",
      port: 80,
      name: "Ropsten JSON RPC",
      description: "JSON RPC endpoint for Ropsten network"
    }
  ],
  "bee.dnp.dappnode.eth": [
    {
      dnpName: "bee.dnp.dappnode.eth",
      serviceName: "bee.dnp.dappnode.eth",
      port: 1633,
      name: "Bee http API endpoint",
      description: "JSON http endpoint for bee"
    }
  ],
  "bitcoin.dnp.dappnode.eth": [
    {
      dnpName: "bitcoin.dnp.dappnode.eth",
      serviceName: "bitcoin.dnp.dappnode.eth",
      port: 8332,
      name: "Bitcoin JSON RPC endpoint",
      description: "JSON endpoint for Bitcoin"
    }
  ],

  
};

