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
      serviceName: "geth.dnp.dappnode.eth",
      port: 8545,
      name: "Geth JSON RPC",
      description: "JSON RPC endpoint for Geth mainnet"
    }
  ]
};
