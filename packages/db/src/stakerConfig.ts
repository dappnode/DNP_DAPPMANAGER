import { dbMain } from "./dbFactory.js";
import { interceptGlobalEnvOnSet } from "./intercepGlobalEnvOnSet.js";
import {
  ConsensusClientMainnet,
  ExecutionClientMainnet,
  ConsensusClientGnosis,
  ExecutionClientGnosis,
  ConsensusClientPrater,
  ExecutionClientPrater,
  ConsensusClientLukso,
  ExecutionClientLukso,
  ConsensusClientHolesky,
  ExecutionClientHolesky,
} from "@dappnode/types";

// Mainnet

const CONSENSUS_CLIENT_MAINNET = "consensus-client-mainnet";
const EXECUTION_CLIENT_MAINNET = "execution-client-mainnet";
const MEVBOOST_MAINNET = "mevboost-mainnet";
const FEE_RECIPIENT_MAINNET = "fee-recipient-mainnet";

/**
 * Whenever a user switches the EC and/or CC from the stakers UI then
 * consensusClientMainnet, executionClientMainnet will change as well
 */

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientMainnet | undefined | null>(
    CONSENSUS_CLIENT_MAINNET,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_MAINNET })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientMainnet | undefined | null>(
    EXECUTION_CLIENT_MAINNET,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_MAINNET })[0]
);

export const mevBoostMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_MAINNET, false),
  Object.keys({ MEVBOOST_MAINNET })[0]
);

export const feeRecipientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | null>(FEE_RECIPIENT_MAINNET, null),
  Object.keys({ FEE_RECIPIENT_MAINNET })[0]
);

// Gnosis

const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";
const MEVBOOST_GNOSIS = "mevboost-gnosis";
const FEE_RECIPIENT_GNOSIS = "fee-recipient-gnosis";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientGnosis | undefined | null>(
    CONSENSUS_CLIENT_GNOSIS,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_GNOSIS })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientGnosis | undefined | null>(
    EXECUTION_CLIENT_GNOSIS,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_GNOSIS })[0]
);

export const mevBoostGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_GNOSIS, false),
  Object.keys({ MEVBOOST_GNOSIS })[0]
);

export const feeRecipientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | null>(FEE_RECIPIENT_GNOSIS, null),
  Object.keys({ FEE_RECIPIENT_GNOSIS })[0]
);

// Prater

const CONSENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";
const MEVBOOST_PRATER = "mevboost-prater";
const FEE_RECIPIENT_PRATER = "fee-recipient-prater";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientPrater | undefined | null>(
    CONSENSUS_CLIENT_PRATER,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_PRATER })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientPrater | undefined | null>(
    EXECUTION_CLIENT_PRATER,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_PRATER })[0]
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  Object.keys({ MEVBOOST_PRATER })[0]
);

export const feeRecipientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | null>(FEE_RECIPIENT_PRATER, null),
  Object.keys({ FEE_RECIPIENT_PRATER })[0]
);

// Holesky

const CONSENSUS_CLIENT_HOLESKY = "consensus-client-holesky";
const EXECUTION_CLIENT_HOLESKY = "execution-client-holesky";
const FEE_RECIPIENT_HOLESKY = "fee-recipient-holesky";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientHolesky | undefined | null>(
    CONSENSUS_CLIENT_HOLESKY,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_HOLESKY })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientHolesky | undefined | null>(
    EXECUTION_CLIENT_HOLESKY,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_HOLESKY })[0]
);

export const feeRecipientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | null>(FEE_RECIPIENT_HOLESKY, null),
  Object.keys({ FEE_RECIPIENT_HOLESKY })[0]
);

// LUKSO

const CONSENSUS_CLIENT_LUKSO = "consensus-client-lukso";
const EXECUTION_CLIENT_LUKSO = "execution-client-lukso";
const MEVBOOST_LUKSO = "mevboost-lukso";
const FEE_RECIPIENT_LUKSO = "fee-recipient-lukso";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<ConsensusClientLukso | undefined | null>(
    CONSENSUS_CLIENT_LUKSO,
    null
  ),
  Object.keys({ CONSENSUS_CLIENT_LUKSO })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientLukso | undefined | null>(
    EXECUTION_CLIENT_LUKSO,
    null
  ),
  Object.keys({ EXECUTION_CLIENT_LUKSO })[0]
);

export const mevBoostLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_LUKSO, false),
  Object.keys({ MEVBOOST_LUKSO })[0]
);

export const feeRecipientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | null>(FEE_RECIPIENT_LUKSO, null),
  Object.keys({ FEE_RECIPIENT_LUKSO })[0]
);
