import {
  ConsensusClientPrater,
  ConsensusClientMainnet,
  ConsensusClientGnosis,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  StakerItemMetadata
} from "../types";
import { dbCache, dbMain } from "./dbFactory";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";

// Mainnet

const STAKER_ITEM_MAINNET = "staker-item-mainnet";
const CONSENSUS_CLIENT_MAINNET = "consensus-client-mainnet";
const EXECUTION_CLIENT_MAINNET = "execution-client-mainnet";
const MEVBOOST_MAINNET = "mevboost-mainnet";

export const stakerItemMainnet = dbCache.indexedByKey<
  Record<string, StakerItemMetadata>,
  string
>({
  rootKey: STAKER_ITEM_MAINNET,
  getKey: target => target,
  validate: (id, metadata) =>
    typeof id === "string" && typeof metadata === "object"
});

export const consensusClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientMainnet | null>(
    CONSENSUS_CLIENT_MAINNET,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_MAINNET })[0]
);

export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientMainnet | null>(
    EXECUTION_CLIENT_MAINNET,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_MAINNET })[0]
);

export const mevBoostMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_MAINNET, false),
  Object.keys({ MEVBOOST_MAINNET })[0]
);

// Gnosis

const STAKER_ITEM_GNOSIS = "staker-item-gnosis";
const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";
const MEVBOOST_GNOSIS = "mevboost-gnosis";

export const stakerItemGnosis = dbCache.indexedByKey<
  Record<string, StakerItemMetadata>,
  string
>({
  rootKey: STAKER_ITEM_GNOSIS,
  getKey: target => target,
  validate: (id, metadata) =>
    typeof id === "string" && typeof metadata === "object"
});

export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientGnosis | null>(CONSENSUS_CLIENT_GNOSIS, null),
  Object.keys({ CONSENSUS_CLIENT_GNOSIS })[0]
);

export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientGnosis | null>(EXECUTION_CLIENT_GNOSIS, null),
  Object.keys({ EXECUTION_CLIENT_GNOSIS })[0]
);

export const mevBoostGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_GNOSIS, false),
  Object.keys({ MEVBOOST_GNOSIS })[0]
);

// Prater

const STAKER_ITEM_PRATER = "staker-item-prater";
const CONSENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";
const MEVBOOST_PRATER = "mevboost-prater";

export const stakerItemPrater = dbCache.indexedByKey<
  Record<string, StakerItemMetadata>,
  string
>({
  rootKey: STAKER_ITEM_PRATER,
  getKey: target => target,
  validate: (id, metadata) =>
    typeof id === "string" && typeof metadata === "object"
});

export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientPrater | null>(CONSENSUS_CLIENT_PRATER, null),
  Object.keys({ CONSENSUS_CLIENT_PRATER })[0]
);

export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientPrater | null>(EXECUTION_CLIENT_PRATER, null),
  Object.keys({ EXECUTION_CLIENT_PRATER })[0]
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  Object.keys({ MEVBOOST_PRATER })[0]
);
