import {
  ConsensusClientPrater,
  ConsensusClientMainnet,
  ConsensusClientGnosis,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  StakerItemData
} from "../types";
import { dbCache, dbMain } from "./dbFactory";
import { dbKeys } from "./dbUtils";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";

// Cache

export const stakerItemMetadata = dbCache.indexedByKey<StakerItemData, string>({
  rootKey: dbKeys.STAKER_ITEM_METADATA,
  getKey: target => target,
  validate: (id, metadata) =>
    typeof id === "string" && typeof metadata === "object"
});

// Mainnet

/**
 * Whenever a user switches the EC and/or CC from the stakers UI then
 * consensusClientMainnet, executionClientMainnet will change as well
 */

export const consensusClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientMainnet | null>(
    dbKeys.CONSENSUS_CLIENT_MAINNET,
    null
  ),
  dbKeys.CONSENSUS_CLIENT_MAINNET
);

export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientMainnet | null>(
    dbKeys.EXECUTION_CLIENT_MAINNET,
    null
  ),
  dbKeys.EXECUTION_CLIENT_MAINNET
);

export const mevBoostMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(dbKeys.MEVBOOST_MAINNET, false),
  dbKeys.MEVBOOST_MAINNET
);

// Gnosis

export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientGnosis | null>(
    dbKeys.CONSENSUS_CLIENT_GNOSIS,
    null
  ),
  dbKeys.CONSENSUS_CLIENT_GNOSIS
);

export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientGnosis | null>(
    dbKeys.EXECUTION_CLIENT_GNOSIS,
    null
  ),
  dbKeys.EXECUTION_CLIENT_GNOSIS
);

export const mevBoostGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(dbKeys.MEVBOOST_GNOSIS, false),
  dbKeys.MEVBOOST_GNOSIS
);

// Prater

export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientPrater | null>(
    dbKeys.CONSENSUS_CLIENT_PRATER,
    null
  ),
  dbKeys.CONSENSUS_CLIENT_PRATER
);

export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientPrater | null>(
    dbKeys.EXECUTION_CLIENT_PRATER,
    null
  ),
  dbKeys.EXECUTION_CLIENT_PRATER
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(dbKeys.MEVBOOST_PRATER, false),
  dbKeys.MEVBOOST_PRATER
);
