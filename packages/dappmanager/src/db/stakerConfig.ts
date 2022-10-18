import {
  ConsensusClientPrater,
  ConsensusClientMainnet,
  ConsensusClientGnosis,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater
} from "../types";
import { dbMain } from "./dbFactory";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";

// Mainnet

const CONSENSUS_CLIENT_MAINNET = "consensus-client-mainnet";
const EXECUTION_CLIENT_MAINNET = "execution-client-mainnet";
const MEVBOOST_MAINNET = "mevboost-mainnet";

export const consensusClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientMainnet | null | undefined>(
    CONSENSUS_CLIENT_MAINNET,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_MAINNET })[0]
);

export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientMainnet | null | undefined>(
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

const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";
const MEVBOOST_GNOSIS = "mevboost-gnosis";

export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientGnosis | null | undefined>(
    CONSENSUS_CLIENT_GNOSIS,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_GNOSIS })[0]
);

export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientGnosis | null | undefined>(
    EXECUTION_CLIENT_GNOSIS,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_GNOSIS })[0]
);

export const mevBoostGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_GNOSIS, false),
  Object.keys({ MEVBOOST_GNOSIS })[0]
);

// Prater

const CONSENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";
const MEVBOOST_PRATER = "mevboost-prater";

export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientPrater | null | undefined>(
    CONSENSUS_CLIENT_PRATER,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_PRATER })[0]
);

export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientPrater | null | undefined>(
    EXECUTION_CLIENT_PRATER,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_PRATER })[0]
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  Object.keys({ MEVBOOST_PRATER })[0]
);
