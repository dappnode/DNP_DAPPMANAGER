import {
  ExecutionClientMainnet,
  ConensusClientMainnet,
  ExecutionClientGnosis,
  ConensusClientGnosis
} from "../common";
import { dbMain } from "./dbFactory";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";

// Mainnet

const CONSENSUS_CLIENT_MAINNET = "consensus-client-mainnet";
const EXECUTION_CLIENT_MAINNET = "execution-client-mainnet";

export const consensusClientMainnet = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientMainnet | null>(
    CONSENSUS_CLIENT_MAINNET,
    null
  ),
  globEnvKey: CONSENSUS_CLIENT_MAINNET
});

export const executionClientMainnet = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConensusClientMainnet | null>(
    EXECUTION_CLIENT_MAINNET,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_MAINNET
});

// Gnosis

const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";

export const consensusClientGnosis = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientGnosis | null>(
    CONSENSUS_CLIENT_GNOSIS,
    null
  ),
  globEnvKey: CONSENSUS_CLIENT_GNOSIS
});

export const executionClientGnosis = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConensusClientGnosis | null>(
    EXECUTION_CLIENT_GNOSIS,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_GNOSIS
});

// Prater

export type ConensusClientPrater = "geth";
export type ExecutionClientPrater = "prysm" | "lighthouse" | "teku" | "nimbus";

const CONENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";

export const consensusClientPrater = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ExecutionClientPrater | null>(
    CONENSUS_CLIENT_PRATER,
    null
  ),
  globEnvKey: CONENSUS_CLIENT_PRATER
});

export const executionClientPrater = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<ConensusClientPrater | null>(
    EXECUTION_CLIENT_PRATER,
    null
  ),
  globEnvKey: EXECUTION_CLIENT_PRATER
});
