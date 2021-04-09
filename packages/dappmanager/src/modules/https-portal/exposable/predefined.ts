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
};

