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

export const consensusClientMainnet = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientMainnet | null>(
    CONSENSUS_CLIENT_MAINNET,
    null
  ),
  globEnvKey: CONSENSUS_CLIENT_MAINNET
});

export const executionClientMainnet = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConsensusClientMainnet | null>(
    EXECUTION_CLIENT_MAINNET,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_MAINNET
});

export const mevBoostMainnet = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<boolean>(MEVBOOST_MAINNET, false),
  globEnvKey: MEVBOOST_MAINNET
});

// Gnosis

const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";
const MEVBOOST_GNOSIS = "mevboost-gnosis";

export const consensusClientGnosis = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientGnosis | null>(
    CONSENSUS_CLIENT_GNOSIS,
    null
  ),
  globEnvKey: CONSENSUS_CLIENT_GNOSIS
});

export const executionClientGnosis = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConsensusClientGnosis | null>(
    EXECUTION_CLIENT_GNOSIS,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_GNOSIS
});

export const mevBoostGnosis = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<boolean>(MEVBOOST_GNOSIS, false),
  globEnvKey: MEVBOOST_GNOSIS
});

// Prater

const CONENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";
const MEVBOOST_PRATER = "mevboost-prater";

export const consensusClientPrater = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientPrater | null>(
    CONENSUS_CLIENT_PRATER,
    null
  ),
  globEnvKey: CONENSUS_CLIENT_PRATER
});

export const executionClientPrater = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConsensusClientPrater | null>(
    EXECUTION_CLIENT_PRATER,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_PRATER
});

export const mevBoostPrater = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  globEnvKey: MEVBOOST_PRATER
});
