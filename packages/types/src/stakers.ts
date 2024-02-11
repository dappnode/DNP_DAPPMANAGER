import { PackageRelease } from "./pkg.js";

// NETWORKS
export const networks = Object.freeze([
  "mainnet",
  "prater",
  "gnosis",
  "lukso",
  "holesky",
] as const);
export type Network = (typeof networks)[number];

// MAINNET
export type ConsensusClientMainnet = (typeof consensusClientsMainnet)[number];
export const consensusClientsMainnet = Object.freeze([
  "lodestar.dnp.dappnode.eth",
  "prysm.dnp.dappnode.eth",
  "lighthouse.dnp.dappnode.eth",
  "teku.dnp.dappnode.eth",
  "nimbus.dnp.dappnode.eth",
] as const);
export type ExecutionClientMainnet = (typeof executionClientsMainnet)[number];
export const executionClientsMainnet = Object.freeze([
  "geth.dnp.dappnode.eth",
  "besu.public.dappnode.eth",
  "erigon.dnp.dappnode.eth",
  "nethermind.public.dappnode.eth",
] as const);
export type SignerMainnet = "web3signer.dnp.dappnode.eth";
export const signerMainnet: SignerMainnet = "web3signer.dnp.dappnode.eth";
export type MevBoostMainnet = "mev-boost.dnp.dappnode.eth";
export const mevBoostMainnet: MevBoostMainnet = "mev-boost.dnp.dappnode.eth";

// PRATER
export type ConsensusClientPrater = (typeof consensusClientsPrater)[number];
export const consensusClientsPrater = Object.freeze([
  "prysm-prater.dnp.dappnode.eth",
  "lighthouse-prater.dnp.dappnode.eth",
  "teku-prater.dnp.dappnode.eth",
  "nimbus-prater.dnp.dappnode.eth",
  "lodestar-prater.dnp.dappnode.eth",
] as const);
export type ExecutionClientPrater = (typeof executionClientsPrater)[number];
export const executionClientsPrater = Object.freeze([
  "goerli-geth.dnp.dappnode.eth",
  "goerli-erigon.dnp.dappnode.eth",
  "goerli-nethermind.dnp.dappnode.eth",
  "goerli-besu.dnp.dappnode.eth",
] as const);
export type SignerPrater = "web3signer-prater.dnp.dappnode.eth";
export const signerPrater: SignerPrater = "web3signer-prater.dnp.dappnode.eth";
export type MevBoostPrater = "mev-boost-goerli.dnp.dappnode.eth";
export const mevBoostPrater: MevBoostPrater =
  "mev-boost-goerli.dnp.dappnode.eth";

// HOLESKY
export type ConsensusClientHolesky = (typeof consensusClientsHolesky)[number];
export const consensusClientsHolesky = Object.freeze([
  "prysm-holesky.dnp.dappnode.eth",
  "lighthouse-holesky.dnp.dappnode.eth",
  "teku-holesky.dnp.dappnode.eth",
  "nimbus-holesky.dnp.dappnode.eth",
  "lodestar-holesky.dnp.dappnode.eth",
] as const);
export type ExecutionClientHolesky = (typeof executionClientsHolesky)[number];
export const executionClientsHolesky = Object.freeze([
  "holesky-geth.dnp.dappnode.eth",
  "holesky-erigon.dnp.dappnode.eth",
  "holesky-nethermind.dnp.dappnode.eth",
  "holesky-besu.dnp.dappnode.eth",
] as const);
export type SignerHolesky = "web3signer-holesky.dnp.dappnode.eth";
export const signerHolesky: SignerHolesky =
  "web3signer-holesky.dnp.dappnode.eth";

// GNOSIS
export type ConsensusClientGnosis = (typeof consensusClientsGnosis)[number];
export const consensusClientsGnosis = Object.freeze([
  //"gnosis-beacon-chain-prysm.dnp.dappnode.eth", DEPRECATED
  "lighthouse-gnosis.dnp.dappnode.eth",
  "teku-gnosis.dnp.dappnode.eth",
  "lodestar-gnosis.dnp.dappnode.eth",
  "nimbus-gnosis.dnp.dappnode.eth",
] as const);
export type ExecutionClientGnosis = (typeof executionClientsGnosis)[number];
export const executionClientsGnosis = Object.freeze([
  "nethermind-xdai.dnp.dappnode.eth",
  "erigon-gnosis.dnp.dappnode.eth",
] as const);
export type SignerGnosis = "web3signer-gnosis.dnp.dappnode.eth";
export const signerGnosis: SignerGnosis = "web3signer-gnosis.dnp.dappnode.eth";

// LUKSO
export type ConsensusClientLukso = (typeof consensusClientsLukso)[number];
export const consensusClientsLukso = Object.freeze([
  /*"lighthouse-lukso.dnp.dappnode.eth",*/
  "prysm-lukso.dnp.dappnode.eth",
  "teku-lukso.dnp.dappnode.eth",
] as const);
export type ExecutionClientLukso = (typeof executionClientsLukso)[number];
export const executionClientsLukso = Object.freeze([
  "lukso-geth.dnp.dappnode.eth",
  /*"lukso-erigon.dnp.dappnode.eth",*/
] as const);
export type SignerLukso = "web3signer-lukso.dnp.dappnode.eth";
export const signerLukso: SignerLukso = "web3signer-lukso.dnp.dappnode.eth";

// COMMON
export const consensusClients = Object.freeze([
  ...consensusClientsMainnet,
  ...consensusClientsPrater,
  ...consensusClientsHolesky,
  ...consensusClientsGnosis,
  ...consensusClientsLukso,
] as const);

export const executionClients = Object.freeze([
  ...executionClientsMainnet,
  ...executionClientsPrater,
  ...executionClientsHolesky,
  ...executionClientsGnosis,
  ...executionClientsLukso,
] as const);

export const signers = Object.freeze([
  signerMainnet,
  signerPrater,
  signerHolesky,
  signerGnosis,
  signerLukso,
] as const);

export const mevBoosts = Object.freeze([
  mevBoostMainnet,
  mevBoostPrater,
  //mevBoostGnosis,
] as const);

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
export interface StakerConfigSet<T extends Network> {
  network: T;
  executionClient?: StakerItemOk<T, "execution">;
  consensusClient?: StakerItemOk<T, "consensus">;
  mevBoost?: StakerItemOk<T, "mev-boost">;
  enableWeb3signer?: boolean;
}

export type ExecutionClient<T extends Network> = T extends "mainnet"
  ? ExecutionClientMainnet
  : T extends "gnosis"
  ? ExecutionClientGnosis
  : T extends "prater"
  ? ExecutionClientPrater
  : T extends "holesky"
  ? ExecutionClientHolesky
  : T extends "lukso"
  ? ExecutionClientLukso
  : never;

export type ConsensusClient<T extends Network> = T extends "mainnet"
  ? ConsensusClientMainnet
  : T extends "gnosis"
  ? ConsensusClientGnosis
  : T extends "prater"
  ? ConsensusClientPrater
  : T extends "holesky"
  ? ConsensusClientHolesky
  : T extends "lukso"
  ? ConsensusClientLukso
  : never;

export type Signer<T extends Network> = T extends "mainnet"
  ? SignerMainnet
  : T extends "gnosis"
  ? SignerGnosis
  : T extends "prater"
  ? SignerPrater
  : T extends "holesky"
  ? SignerHolesky
  : T extends "lukso"
  ? SignerLukso
  : never;

export type MevBoost<T extends Network> = T extends "mainnet"
  ? MevBoostMainnet
  : T extends "prater"
  ? MevBoostPrater
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

// STAKERS
export const stakerPkgs = Object.freeze([
  ...executionClientsMainnet,
  ...consensusClientsMainnet,
  signerMainnet,
  mevBoostMainnet,
  ...executionClientsPrater,
  ...consensusClientsPrater,
  signerPrater,
  mevBoostPrater,
  ...executionClientsHolesky,
  ...consensusClientsHolesky,
  signerHolesky,
  ...executionClientsGnosis,
  ...consensusClientsGnosis,
  signerGnosis,
  ...executionClientsLukso,
  ...consensusClientsLukso,
  signerLukso,
] as const);
