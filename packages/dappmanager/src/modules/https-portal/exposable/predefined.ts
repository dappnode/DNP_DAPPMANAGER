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
      description: "JSON RPC endpoint for mainnet"
    },
    {
      fromSubdomain: "geth-ws",
      dnpName: "geth.dnp.dappnode.eth",
      serviceName: "geth.dnp.dappnode.eth",
      port: 8546,
      name: "Geth JSON RPC (WS)",
      description: "JSON RPC WebSocket endpoint for mainnet"
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
  ]
};
