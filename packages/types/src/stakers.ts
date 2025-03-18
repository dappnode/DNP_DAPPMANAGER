import { PackageRelease } from "./pkg.js";

// NETWORKS

export enum Network {
  Mainnet = "mainnet",
  Prater = "prater",
  Gnosis = "gnosis",
  Lukso = "lukso",
  Holesky = "holesky",
  Hoodie = "hoodie"
}

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

// HOODIE
export enum ConsensusClientHoodie {
  Prysm = "prysm-hoodie.dnp.dappnode.eth",
  Lighthouse = "lighthouse-hoodie.dnp.dappnode.eth",
  Teku = "teku-hoodie.dnp.dappnode.eth",
  Nimbus = "nimbus-hoodie.dnp.dappnode.eth",
  Lodestar = "lodestar-hoodie.dnp.dappnode.eth"
}
export enum ExecutionClientHoodie {
  Geth = "hoodie-geth.dnp.dappnode.eth",
  Erigon = "hoodie-erigon.dnp.dappnode.eth",
  Nethermind = "hoodie-nethermind.dnp.dappnode.eth",
  Besu = "hoodie-besu.dnp.dappnode.eth",
  Reth = "hoodie-reth.dnp.dappnode.eth"
}
export enum SignerHoodie {
  Web3signer = "web3signer-hoodie.dnp.dappnode.eth"
}
export enum MevBoostHoodie {
  Mevboost = "mev-boost-hoodie.dnp.dappnode.eth"
}

// GNOSIS
export enum ConsensusClientGnosis {
  Lighthouse = "lighthouse-gnosis.dnp.dappnode.eth",
  Teku = "teku-gnosis.dnp.dappnode.eth",
  Lodestar = "lodestar-gnosis.dnp.dappnode.eth",
  Nimbus = "nimbus-gnosis.dnp.dappnode.eth"
}
export enum ExecutionClientGnosis {
  Nethermind = "nethermind-xdai.dnp.dappnode.eth",
  Erigon = "gnosis-erigon.dnp.dappnode.eth"
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

export type StakerItem = StakerItemOk | StakerItemError;

interface StakerItemBasic {
  dnpName: string;
  relays?: string[];
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
}
