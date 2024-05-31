import { dbMain } from "./dbFactory.js";
import { interceptGlobalEnvOnSet } from "./intercepGlobalEnvOnSet.js";

// Mainnet

const CONSENSUS_CLIENT_MAINNET = "consensus-client-mainnet";
const EXECUTION_CLIENT_MAINNET = "execution-client-mainnet";
const MEVBOOST_MAINNET = "mevboost-mainnet";

/**
 * Whenever a user switches the EC and/or CC from the stakers UI then
 * consensusClientMainnet, executionClientMainnet will change as well
 */

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_MAINNET, null),
  CONSENSUS_CLIENT_MAINNET
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_MAINNET, null),
  EXECUTION_CLIENT_MAINNET
);

export const mevBoostMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_MAINNET, false),
  MEVBOOST_MAINNET
);
// Gnosis

const CONSENSUS_CLIENT_GNOSIS = "consensus-client-gnosis";
const EXECUTION_CLIENT_GNOSIS = "execution-client-gnosis";
const MEVBOOST_GNOSIS = "mevboost-gnosis";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_GNOSIS, null),
  CONSENSUS_CLIENT_GNOSIS
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_GNOSIS, null),
  EXECUTION_CLIENT_GNOSIS
);

export const mevBoostGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_GNOSIS, false),
  MEVBOOST_GNOSIS
);

// Prater

const CONSENSUS_CLIENT_PRATER = "consensus-client-prater";
const EXECUTION_CLIENT_PRATER = "execution-client-prater";
const MEVBOOST_PRATER = "mevboost-prater";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_PRATER, null),
  CONSENSUS_CLIENT_PRATER
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_PRATER, null),
  EXECUTION_CLIENT_PRATER
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  MEVBOOST_PRATER
);

// Holesky

const CONSENSUS_CLIENT_HOLESKY = "consensus-client-holesky";
const EXECUTION_CLIENT_HOLESKY = "execution-client-holesky";
const MEVBOOST_HOLESKY = "mevboost-holesky";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_HOLESKY, null),
  CONSENSUS_CLIENT_HOLESKY
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_HOLESKY, null),
  EXECUTION_CLIENT_HOLESKY
);

export const mevBoostHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_HOLESKY, false),
  MEVBOOST_HOLESKY
);

// LUKSO

const CONSENSUS_CLIENT_LUKSO = "consensus-client-lukso";
const EXECUTION_CLIENT_LUKSO = "execution-client-lukso";
const MEVBOOST_LUKSO = "mevboost-lukso";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_LUKSO, null),
  CONSENSUS_CLIENT_LUKSO
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_LUKSO, null),
  EXECUTION_CLIENT_LUKSO
);

export const mevBoostLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_LUKSO, false),
  MEVBOOST_LUKSO
);
