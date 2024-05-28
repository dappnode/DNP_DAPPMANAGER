import { PackageRelease } from "./pkg.js";

// NETWORKS

export enum Network {
  Mainnet = "mainnet",
  Prater = "prater",
  Gnosis = "gnosis",
  Lukso = "lukso",
  Holesky = "holesky",
}

// MAINNET
export enum ConsensusClientMainnet {
  Lodestar = "lodestar.dnp.dappnode.eth",
  Prysm = "prysm.dnp.dappnode.eth",
  Lighthouse = "lighthouse.dnp.dappnode.eth",
  Teku = "teku.dnp.dappnode.eth",
  Nimbus = "nimbus.dnp.dappnode.eth",
}
export enum ExecutionClientMainnet {
  Geth = "geth.dnp.dappnode.eth",
  Besu = "besu.public.dappnode.eth",
  Erigon = "erigon.dnp.dappnode.eth",
  Nethermind = "nethermind.public.dappnode.eth",
}
export enum SignerMainnet {
  Web3signer = "web3signer.dnp.dappnode.eth",
}
export enum MevBoostMainnet {
  Mevboost = "mev-boost.dnp.dappnode.eth",
}

// PRATER
export enum ConsensusClientPrater {
  Prysm = "prysm-prater.dnp.dappnode.eth",
  Lighthouse = "lighthouse-prater.dnp.dappnode.eth",
  Teku = "teku-prater.dnp.dappnode.eth",
  Nimbus = "nimbus-prater.dnp.dappnode.eth",
  Lodestar = "lodestar-prater.dnp.dappnode.eth",
}
export enum ExecutionClientPrater {
  Geth = "goerli-geth.dnp.dappnode.eth",
  Erigon = "goerli-erigon.dnp.dappnode.eth",
  Nethermind = "goerli-nethermind.dnp.dappnode.eth",
  Besu = "goerli-besu.dnp.dappnode.eth",
}
export enum SignerPrater {
  Web3signer = "web3signer-prater.dnp.dappnode.eth",
}
export enum MevBoostPrater {
  Mevboost = "mev-boost-goerli.dnp.dappnode.eth",
}

// HOLESKY
export enum ConsensusClientHolesky {
  Prysm = "prysm-holesky.dnp.dappnode.eth",
  Lighthouse = "lighthouse-holesky.dnp.dappnode.eth",
  Teku = "teku-holesky.dnp.dappnode.eth",
  Nimbus = "nimbus-holesky.dnp.dappnode.eth",
  Lodestar = "lodestar-holesky.dnp.dappnode.eth",
}
export enum ExecutionClientHolesky {
  Geth = "holesky-geth.dnp.dappnode.eth",
  Erigon = "holesky-erigon.dnp.dappnode.eth",
  Nethermind = "holesky-nethermind.dnp.dappnode.eth",
  Besu = "holesky-besu.dnp.dappnode.eth",
}
export enum SignerHolesky {
  Web3signer = "web3signer-holesky.dnp.dappnode.eth",
}
export enum MevBoostHolesky {
  Mevboost = "mev-boost-holesky.dnp.dappnode.eth",
}

// GNOSIS
export enum ConsensusClientGnosis {
  Lighthouse = "lighthouse-gnosis.dnp.dappnode.eth",
  Teku = "teku-gnosis.dnp.dappnode.eth",
  Lodestar = "lodestar-gnosis.dnp.dappnode.eth",
  Nimbus = "nimbus-gnosis.dnp.dappnode.eth",
}
export enum ExecutionClientGnosis {
  Nethermind = "nethermind-xdai.dnp.dappnode.eth",
  Erigon = "gnosis-erigon.dnp.dappnode.eth",
}
export enum SignerGnosis {
  Web3signer = "web3signer-gnosis.dnp.dappnode.eth",
}

// LUKSO
export enum ConsensusClientLukso {
  /*"lighthouse-lukso.dnp.dappnode.eth",*/
  Prysm = "prysm-lukso.dnp.dappnode.eth",
  Teku = "teku-lukso.dnp.dappnode.eth",
}

export enum ExecutionClientLukso {
  Geth = "lukso-geth.dnp.dappnode.eth",
  /*"lukso-erigon.dnp.dappnode.eth",*/
}
export enum SignerLukso {
  Web3signer = "web3signer-lukso.dnp.dappnode.eth",
}

export type StakerType = "execution" | "consensus" | "signer" | "mev-boost";

export type StakerItem<T extends Network, P extends StakerType> =
  | StakerItemOk<T, P>
  | StakerItemError<T, P>;

interface StakerExecution<T extends Network> {
  dnpName: ExecutionClient<T>;
}

interface StakerConsensus<T extends Network> {
  dnpName: ConsensusClient<T>;
  useCheckpointSync?: boolean;
}

interface StakerSigner<T extends Network> {
  dnpName: Signer<T>;
}

interface StakerMevBoost<T extends Network> {
  dnpName: MevBoost<T>;
  relays?: string[];
}

type StakerItemBasic<
  T extends Network,
  P extends StakerType
> = P extends "execution"
  ? StakerExecution<T>
  : P extends "consensus"
  ? StakerConsensus<T>
  : P extends "signer"
  ? StakerSigner<T>
  : P extends "mev-boost"
  ? StakerMevBoost<T>
  : P extends "signer"
  ? StakerSigner<T>
  : never;

export type StakerItemError<T extends Network, P extends StakerType> = {
  status: "error";
  error: string;
} & StakerItemBasic<T, P>;

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

export type StakerItemOk<T extends Network, P extends StakerType> = {
  status: "ok";
  avatarUrl: string;
  isInstalled: boolean;
  isUpdated: boolean;
  isRunning: boolean;
  data?: PackageItemData;
  isSelected: boolean;
} & StakerItemBasic<T, P>;

export interface StakerConfigGet<T extends Network> {
  executionClients: StakerItem<T, "execution">[];
  consensusClients: StakerItem<T, "consensus">[];
  web3Signer: StakerItem<T, "signer">;
  mevBoost: StakerItem<T, "mev-boost">;
}

export interface StakerConfigGetOk<T extends Network> {
  executionClients: StakerItemOk<T, "execution">[];
  consensusClients: StakerItemOk<T, "consensus">[];
  web3signer: StakerItemOk<T, "signer">;
  mevBoost: StakerItemOk<T, "mev-boost">;
}
export interface StakerConfigSet {
  network: Network;
  executionDnpName: string | null;
  consensusDnpName: string | null;
  useCheckpointSync: boolean;
  mevBoostDnpName: string | null;
  relays: string[];
  web3signerDnpName: string | null;
}

// export type ExecutionClient<T extends Network> =
//   T extends keyof ExecutionClientMap ? ExecutionClientMap[T] : never;

export type ExecutionClient<T extends Network> = T extends infer R
  ? R extends Network.Mainnet
    ? ExecutionClientMainnet
    : R extends Network.Prater
    ? ExecutionClientPrater
    : R extends Network.Gnosis
    ? ExecutionClientGnosis
    : R extends Network.Lukso
    ? ExecutionClientLukso
    : R extends Network.Holesky
    ? ExecutionClientHolesky
    : never
  : never;

export type ConsensusClient<T extends Network> = T extends infer R
  ? R extends Network.Mainnet
    ? ConsensusClientMainnet
    : R extends Network.Prater
    ? ConsensusClientPrater
    : R extends Network.Gnosis
    ? ConsensusClientGnosis
    : R extends Network.Lukso
    ? ConsensusClientLukso
    : R extends Network.Holesky
    ? ConsensusClientHolesky
    : never
  : never;

export type Signer<T extends Network> = T extends infer R
  ? R extends Network.Mainnet
    ? SignerMainnet
    : R extends Network.Prater
    ? SignerPrater
    : R extends Network.Gnosis
    ? SignerGnosis
    : R extends Network.Lukso
    ? SignerLukso
    : R extends Network.Holesky
    ? SignerHolesky
    : never
  : never;

export type MevBoost<T extends Network> = T extends infer R
  ? R extends Network.Mainnet
    ? MevBoostMainnet
    : R extends Network.Prater
    ? MevBoostPrater
    : R extends Network.Gnosis
    ? never
    : R extends Network.Lukso
    ? never
    : R extends Network.Holesky
    ? MevBoostHolesky
    : never
  : never;

export interface StakerConfigByNetwork<T extends Network> {
  executionClient: ExecutionClient<T> | undefined | null;
  consensusClient: ConsensusClient<T> | undefined | null;
  isMevBoostSelected: boolean;
}
export interface StakerCompatibleVersionsByNetwork<T extends Network> {
  compatibleExecution: {
    dnpName: ExecutionClient<T>;
    minVersion: string;
  }[];
  compatibleConsensus: {
    dnpName: ConsensusClient<T>;
    minVersion: string;
  }[];
  compatibleSigner: {
    dnpName: Signer<T>;
    minVersion: string;
  };
  compatibleMevBoost: { dnpName: MevBoost<T>; minVersion: string };
}
