import { PackageRelease } from "./pkg.js";

// NETWORKS

export enum Network {
  Mainnet = "mainnet",
  Prater = "prater",
  Gnosis = "gnosis",
  Lukso = "lukso",
  Holesky = "holesky",
  Sepolia = "sepolia",
  Hoodi = "hoodi",
  StarknetMainnet = "starknet",
  StarknetSepolia = "starknet-sepolia"
}

export const networksByType = {
  mainnets: [Network.Mainnet, Network.Gnosis, Network.Lukso, Network.StarknetMainnet],
  testnets: [Network.Hoodi, Network.Prater, Network.Holesky, Network.Sepolia, Network.StarknetSepolia]
};

// MAINNET
export enum ConsensusClientMainnet {
  Lodestar = "lodestar.dnp.dappnode.eth",
  Prysm = "prysm.dnp.dappnode.eth",
  Lighthouse = "lighthouse.dnp.dappnode.eth",
  Teku = "teku.dnp.dappnode.eth",
  Nimbus = "nimbus.dnp.dappnode.eth"
}
export enum ExecutionClientMainnet {
  Geth = "geth.dnp.dappnode.eth",
  Besu = "besu.public.dappnode.eth",
  Erigon = "erigon.dnp.dappnode.eth",
  Nethermind = "nethermind.public.dappnode.eth",
  Reth = "reth.dnp.dappnode.eth"
}
export enum SignerMainnet {
  Web3signer = "web3signer.dnp.dappnode.eth"
}
export enum MevBoostMainnet {
  Mevboost = "mev-boost.dnp.dappnode.eth"
}

// PRATER
export enum ConsensusClientPrater {
  Prysm = "prysm-prater.dnp.dappnode.eth",
  Lighthouse = "lighthouse-prater.dnp.dappnode.eth",
  Teku = "teku-prater.dnp.dappnode.eth",
  Nimbus = "nimbus-prater.dnp.dappnode.eth",
  Lodestar = "lodestar-prater.dnp.dappnode.eth"
}
export enum ExecutionClientPrater {
  Geth = "goerli-geth.dnp.dappnode.eth",
  Erigon = "goerli-erigon.dnp.dappnode.eth",
  Nethermind = "goerli-nethermind.dnp.dappnode.eth",
  Besu = "goerli-besu.dnp.dappnode.eth"
}
export enum SignerPrater {
  Web3signer = "web3signer-prater.dnp.dappnode.eth"
}
export enum MevBoostPrater {
  Mevboost = "mev-boost-goerli.dnp.dappnode.eth"
}

// HOLESKY
export enum ConsensusClientHolesky {
  Prysm = "prysm-holesky.dnp.dappnode.eth",
  Lighthouse = "lighthouse-holesky.dnp.dappnode.eth",
  Teku = "teku-holesky.dnp.dappnode.eth",
  Nimbus = "nimbus-holesky.dnp.dappnode.eth",
  Lodestar = "lodestar-holesky.dnp.dappnode.eth"
}
export enum ExecutionClientHolesky {
  Geth = "holesky-geth.dnp.dappnode.eth",
  Erigon = "holesky-erigon.dnp.dappnode.eth",
  Nethermind = "holesky-nethermind.dnp.dappnode.eth",
  Besu = "holesky-besu.dnp.dappnode.eth",
  Reth = "holesky-reth.dnp.dappnode.eth"
}
export enum SignerHolesky {
  Web3signer = "web3signer-holesky.dnp.dappnode.eth"
}
export enum MevBoostHolesky {
  Mevboost = "mev-boost-holesky.dnp.dappnode.eth"
}

// HOODI
export enum ConsensusClientHoodi {
  Prysm = "prysm-hoodi.dnp.dappnode.eth",
  Lighthouse = "lighthouse-hoodi.dnp.dappnode.eth",
  Teku = "teku-hoodi.dnp.dappnode.eth",
  Nimbus = "nimbus-hoodi.dnp.dappnode.eth",
  Lodestar = "lodestar-hoodi.dnp.dappnode.eth"
}
export enum ExecutionClientHoodi {
  Geth = "hoodi-geth.dnp.dappnode.eth",
  Erigon = "hoodi-erigon.dnp.dappnode.eth",
  Nethermind = "hoodi-nethermind.dnp.dappnode.eth",
  Besu = "hoodi-besu.dnp.dappnode.eth",
  Reth = "hoodi-reth.dnp.dappnode.eth"
}
export enum SignerHoodi {
  Web3signer = "web3signer-hoodi.dnp.dappnode.eth"
}
export enum MevBoostHoodi {
  Mevboost = "mev-boost-hoodi.dnp.dappnode.eth"
}

// GNOSIS
export enum ConsensusClientGnosis {
  Lighthouse = "lighthouse-gnosis.dnp.dappnode.eth",
  Teku = "teku-gnosis.dnp.dappnode.eth",
  Lodestar = "lodestar-gnosis.dnp.dappnode.eth"
}
export enum ExecutionClientGnosis {
  Nethermind = "nethermind-xdai.dnp.dappnode.eth",
  Erigon = "gnosis-erigon.dnp.dappnode.eth",
  Geth = "gnosis-geth.dnp.dappnode.eth",
  Reth = "gnosis-reth.dnp.dappnode.eth"
}
export enum SignerGnosis {
  Web3signer = "web3signer-gnosis.dnp.dappnode.eth"
}

// LUKSO
export enum ConsensusClientLukso {
  /*"lighthouse-lukso.dnp.dappnode.eth",*/
  Prysm = "prysm-lukso.dnp.dappnode.eth",
  Teku = "teku-lukso.dnp.dappnode.eth"
}

export enum ExecutionClientLukso {
  Geth = "lukso-geth.dnp.dappnode.eth"
  /*"lukso-erigon.dnp.dappnode.eth",*/
}
export enum SignerLukso {
  Web3signer = "web3signer-lukso.dnp.dappnode.eth"
}

// SEPOLIA
export enum ConsensusClientSepolia {
  /*"prysm-sepolia.dnp.dappnode.eth",*/
  Prysm = "prysm-sepolia.dnp.dappnode.eth",
  Lighthouse = "lighthouse-sepolia.dnp.dappnode.eth"
}

export enum ExecutionClientSepolia {
  Geth = "sepolia-geth.dnp.dappnode.eth",
  Reth = "sepolia-reth.dnp.dappnode.eth"
}

export enum SignerSepolia {
  Web3signer = "web3signer-sepolia.dnp.dappnode.eth"
}

// For starknet, we treat juno/pathfinder as an execution client, but its basically a fullnode on its own.
// "Starknetstaking" (validator sofware) is treated as consensus client.
// STARKNET MAINNET
export enum StarknetExecutionMainnet {
  Juno = "juno.dnp.dappnode.eth",
  Pathfinder = "pathfinder.dnp.dappnode.eth"
}
export enum StarknetConsensusMainnet {
  StarknetStaking = "starknetstaking.dnp.dappnode.eth"
}

// STARKNET SEPOLIA
export enum StarknetExecutionSepolia {
  Juno = "juno-sepolia.dnp.dappnode.eth",
  Pathfinder = "pathfinder-sepolia.dnp.dappnode.eth"
}
export enum StarknetConsensusSepolia {
  StarknetStaking = "starknetstaking-sepolia.dnp.dappnode.eth"
}

export type StakerItem = StakerItemOk | StakerItemError;

interface StakerItemBasic {
  dnpName: string;
  relays?: string[];
  starknetSignerOperationalAddress?: string;
  starknetSignerPrivateKey?: string;
}

export type StakerItemError = {
  status: "error";
  error: string;
} & StakerItemBasic;

/**
 * Metadata of a staker item to be cached
 */
export type PackageItemData = Pick<
  PackageRelease,
  | "dnpName"
  | "reqVersion"
  | "semVersion"
  | "imageFile"
  | "avatarFile"
  | "manifest"
  | "warnings"
  | "origin"
  | "signedSafe"
>;

export type StakerItemOk = {
  status: "ok";
  avatarUrl: string;
  isInstalled: boolean;
  isUpdated: boolean;
  isRunning: boolean;
  data?: PackageItemData;
  isSelected: boolean;
} & StakerItemBasic;

export interface StakerConfigGet {
  executionClients: StakerItem[];
  consensusClients: StakerItem[];
  web3Signer: StakerItem;
  mevBoost?: StakerItem;
}

export interface StakerConfigSet {
  network: Network;
  executionDnpName: string | null;
  consensusDnpName: string | null;
  mevBoostDnpName: string | null;
  relays: string[];
  web3signerDnpName: string | null;
  /** Starknet-specific: Operational address for signing attestations (Hot wallet) */
  starknetSignerOperationalAddress?: string;
  /** Starknet-specific: Internal signing private key */
  starknetSignerPrivateKey?: string;
}
