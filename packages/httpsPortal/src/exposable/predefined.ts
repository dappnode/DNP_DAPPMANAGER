import { ExposableServiceInfo } from "@dappnode/types";

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
      description: "JSON RPC endpoint for Geth Ethereum mainnet",
      external: true
    },
    {
      fromSubdomain: "geth-ws",
      dnpName: "geth.dnp.dappnode.eth",
      serviceName: "geth.dnp.dappnode.eth",
      port: 8546,
      name: "Geth JSON RPC (WS)",
      description: "WebSockets endpoint for Geth Ethereum mainnet",
      external: true
    }
  ],
  "goerli-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "goerli-geth",
      dnpName: "goerli-geth.dnp.dappnode.eth",
      serviceName: "goerli-geth.dnp.dappnode.eth",
      port: 8545,
      name: "Goerli Geth JSON RPC",
      description: "JSON RPC endpoint for Goerli Ethereum network",
      external: true
    },
    {
      fromSubdomain: "goerli-geth-ws",
      dnpName: "goerli-geth.dnp.dappnode.eth",
      serviceName: "goerli-geth.dnp.dappnode.eth",
      port: 8546,
      name: "Goerli Geth JSON RPC (WS)",
      description: "WebSockets endpoint for Goerli Ethereum network",
      external: true
    }
  ],
  "kovan.dnp.dappnode.eth": [
    {
      fromSubdomain: "kovan",
      dnpName: "kovan.dnp.dappnode.eth",
      serviceName: "kovan.dnp.dappnode.eth",
      port: 8545,
      name: "Kovan JSON RPC",
      description: "JSON RPC endpoint for Kovan Ethereum network",
      external: true
    },
    {
      fromSubdomain: "kovan-ws",
      dnpName: "kovan.dnp.dappnode.eth",
      serviceName: "kovan.dnp.dappnode.eth",
      port: 8546,
      name: "Kovan JSON RPC (WS)",
      description: "WebSockets endpoint for Kovan Ethereum network",
      external: true
    }
  ],
  "nethermind.public.dappnode.eth": [
    {
      fromSubdomain: "nethermind",
      dnpName: "nethermind.public.dappnode.eth",
      serviceName: "nethermind.public.dappnode.eth",
      port: 8545,
      name: "Nethermind JSON RPC",
      description: "JSON RPC endpoint for Nethermind Ethereum mainnet",
      external: true
    },
    {
      fromSubdomain: "nethermind-ws",
      dnpName: "nethermind.public.dappnode.eth",
      serviceName: "nethermind.public.dappnode.eth",
      port: 8546,
      name: "Nethermind JSON RPC (WS)",
      description: "WebSockets endpoint for Nethermind Ethereum mainnet",
      external: true
    }
  ],
  "rinkeby.dnp.dappnode.eth": [
    {
      fromSubdomain: "rinkeby",
      dnpName: "rinkeby.dnp.dappnode.eth",
      serviceName: "rinkeby.dnp.dappnode.eth",
      port: 8545,
      name: "Rinkeby JSON RPC",
      description: "JSON RPC endpoint for Rinkeby Ethereum network",
      external: true
    },
    {
      fromSubdomain: "rinkeby-ws",
      dnpName: "rinkeby.dnp.dappnode.eth",
      serviceName: "rinkeby.dnp.dappnode.eth",
      port: 8546,
      name: "Rinkeby JSON RPC (WS)",
      description: "WebSockets endpoint for Rinkeby Ethereum network",
      external: true
    }
  ],
  "ropsten.dnp.dappnode.eth": [
    {
      fromSubdomain: "ropsten",
      dnpName: "ropsten.dnp.dappnode.eth",
      serviceName: "ropsten.dnp.dappnode.eth",
      port: 8545,
      name: "Ropsten JSON RPC",
      description: "JSON RPC endpoint for Ropsten Ethereum network",
      external: true
    },
    {
      fromSubdomain: "ropsten-ws",
      dnpName: "ropsten.dnp.dappnode.eth",
      serviceName: "ropsten.dnp.dappnode.eth",
      port: 8546,
      name: "Ropsten JSON RPC (WS)",
      description: "WebSockets endpoint for Ropsten Ethereum network",
      external: true
    }
  ],
  "avalanche.public.dappnode.eth": [
    {
      fromSubdomain: "avalanche",
      dnpName: "avalanche.public.dappnode.eth",
      serviceName: "wallet",
      port: 80,
      name: "Avalanche wallet",
      description: "Avalanche wallet UI",
      external: true
    }
  ],
  "bee.dnp.dappnode.eth": [
    {
      fromSubdomain: "bee",
      dnpName: "bee.dnp.dappnode.eth",
      serviceName: "bee.dnp.dappnode.eth",
      port: 1633,
      name: "Bee JSON RPC",
      description: "JSON RPC endpoint for Bee",
      external: true
    }
  ],
  "bitcoin.dnp.dappnode.eth": [
    {
      fromSubdomain: "bitcoin",
      dnpName: "bitcoin.dnp.dappnode.eth",
      serviceName: "bitcoin.dnp.dappnode.eth",
      port: 8332,
      name: "Bitcoin JSON RPC",
      description: "JSON RPC endpoint for Bitcoin",
      external: true
    }
  ],
  "monero.dnp.dappnode.eth": [
    {
      fromSubdomain: "monero",
      dnpName: "monero.dnp.dappnode.eth",
      serviceName: "monero.dnp.dappnode.eth",
      port: 18081,
      name: "Monero JSON RPC",
      description: "JSON RPC endpoint for Monero",
      external: true
    }
  ],
  "zcash.public.dappnode.eth": [
    {
      fromSubdomain: "zcash",
      dnpName: "zcash.public.dappnode.eth",
      serviceName: "zcash.public.dappnode.eth",
      port: 8232,
      name: "Zcash JSON RPC",
      description: "JSON RPC endpoint for Zcash",
      external: true
    }
  ],
  "owncloud.dnp.dappnode.eth": [
    {
      fromSubdomain: "owncloud",
      dnpName: "owncloud.dnp.dappnode.eth",
      serviceName: "owncloud",
      port: 80,
      name: "Owncloud UI",
      description: "Owncloud UI",
      external: true
    }
  ],
  "trustlines.dnp.dappnode.eth": [
    {
      fromSubdomain: "trustlines",
      dnpName: "trustlines.dnp.dappnode.eth",
      serviceName: "node",
      port: 8545,
      name: "Truslines JSON RPC",
      description: "JSON RPC endpoint for Truslines network",
      external: true
    },
    {
      fromSubdomain: "trustlines-ws",
      dnpName: "trustlines.dnp.dappnode.eth",
      serviceName: "node",
      port: 8546,
      name: "Truslines JSON RPC (WS)",
      description: "WebSockets endpoint for Truslines network",
      external: true
    }
  ],
  "turbo-geth.dnp.dappnode.eth": [
    {
      fromSubdomain: "turbo-geth",
      dnpName: "turbo-geth.dnp.dappnode.eth",
      serviceName: "rpcdaemon",
      port: 8545,
      name: "Turbo-Geth JSON RPC",
      description: "JSON RPC endpoint for Turbo-Geth Ethereum mainnet",
      external: true
    },
    {
      fromSubdomain: "turbo-geth-ws",
      dnpName: "turbo-geth.dnp.dappnode.eth",
      serviceName: "rpcdaemon",
      port: 8546,
      name: "Turbo-Geth JSON RPC (WS)",
      description: "WebSockets endpoint for Turbo-Geth Ethereum mainnet",
      external: true
    }
  ]
};
