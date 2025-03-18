// Global ENVs names
export const GLOBAL_ENVS = {
  ACTIVE: "_DAPPNODE_GLOBAL_ENVS_ACTIVE",
  DOMAIN: "_DAPPNODE_GLOBAL_DOMAIN", // "" || "6b3d49d4965584c2.dyndns.dappnode.io"
  STATIC_IP: "_DAPPNODE_GLOBAL_STATIC_IP", // "" || "138.68.106.96"
  HOSTNAME: "_DAPPNODE_GLOBAL_HOSTNAME", // "6b3d49d4965584c2.dyndns.dappnode.io" || "138.68.106.96"
  INTERNAL_IP: "_DAPPNODE_GLOBAL_INTERNAL_IP", // "192.168.0.1"
  UPNP_AVAILABLE: "_DAPPNODE_GLOBAL_UPNP_AVAILABLE", // "true" || "false"
  NO_NAT_LOOPBACK: "_DAPPNODE_GLOBAL_NO_NAT_LOOPBACK", // "true" || "false"
  PUBKEY: "_DAPPNODE_GLOBAL_PUBKEY", // "0x048e66b3e549818ea2cb354fb70749f6c8de8fa484f7530fc447d5fe80a1c424e4f5ae648d648c980ae7095d1efad87161d83886ca4b6c498ac22a93da5099014a",
  ADDRESS: "_DAPPNODE_GLOBAL_ADDRESS", // "0x6B3D49d4965584C28Fbf14B82b1012664a73b9Ab"
  PUBLIC_IP: "_DAPPNODE_GLOBAL_PUBLIC_IP", // "138.68.106.96"
  SERVER_NAME: "_DAPPNODE_GLOBAL_SERVER_NAME", // "MyDAppNode"
  CONSENSUS_CLIENT_MAINNET: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_MAINNET", // "prysm.dnp.dappnode.eth"
  EXECUTION_CLIENT_MAINNET: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_MAINNET", // "geth.dnp.dappnode.eth"
  MEVBOOST_MAINNET: "_DAPPNODE_GLOBAL_MEVBOOST_MAINNET", // "mevboost.dnp.dappnode
  CONSENSUS_CLIENT_GNOSIS: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_GNOSIS", // "teku-gnosis.dnp.dappnode.eth"
  EXECUTION_CLIENT_GNOSIS: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_GNOSIS", // "nethermind-xdai.dnp.dappnode.eth"
  MEVBOOST_GNOSIS: "_DAPPNODE_GLOBAL_MEVBOOST_GNOSIS", // "mevboost-gnosis.dnp
  CONSENSUS_CLIENT_PRATER: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_PRATER", // "prysm-prater.dnp.dappnode.eth"
  EXECUTION_CLIENT_PRATER: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_PRATER", // "goerli-geth.dnp.dappnode.eth"
  MEVBOOST_PRATER: "_DAPPNODE_GLOBAL_MEVBOOST_PRATER", // "mevboost-prater.dnp.dappnode.eth"
  CONSENSUS_CLIENT_LUKSO: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_LUKSO", // "prysm-lukso.dnp.dappnode.eth"
  EXECUTION_CLIENT_LUKSO: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_LUKSO", // "lukso-geth.dnp.dappnode.eth",
  MEVBOOST_LUKSO: "_DAPPNODE_GLOBAL_MEVBOOST_LUKSO", // "mevboost-lukso.dnp.dappnode.eth"
  CONSENSUS_CLIENT_HOLESKY: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_HOLESKY", // "prysm-holesky.dnp.dappnode.eth"
  EXECUTION_CLIENT_HOLESKY: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_HOLESKY", // "holesky-geth.dnp.dappnode.eth"
  MEVBOOST_HOLESKY: "_DAPPNODE_GLOBAL_MEVBOOST_HOLESKY", // "mevboost-holesky.dnp.dappnode.eth"
  CONSENSUS_CLIENT_HOODIE: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_HOODIE", // "prysm-hoodie.dnp.dappnode.eth"
  EXECUTION_CLIENT_HOODIE: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_HOODIE", // "hoodie-geth.dnp.dappnode.eth"
  MEVBOOST_HOODIE: "_DAPPNODE_GLOBAL_MEVBOOST_HOODIE" // "mevboost-hoodie.dnp.dappnode.eth"
};

/**
 * ===========
 * GLOBAL ENVS
 * ===========
 */

type GlobalEnvsKeys = keyof typeof GLOBAL_ENVS;
type GlobalEnvsValues = (typeof GLOBAL_ENVS)[GlobalEnvsKeys];

export type GlobalEnvs = {
  [K in keyof typeof GLOBAL_ENVS]: string;
};

// Create type GlobalEnvsPrefixed where the key may be any value from GlobalEnvsValues
export type GlobalEnvsPrefixed = {
  [K in GlobalEnvsValues]: string;
};
