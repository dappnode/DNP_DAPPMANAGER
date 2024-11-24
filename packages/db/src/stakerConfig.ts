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
  Object.keys({ CONSENSUS_CLIENT_MAINNET })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientMainnet = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_MAINNET, null),
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

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_GNOSIS, null),
  Object.keys({ CONSENSUS_CLIENT_GNOSIS })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientGnosis = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_GNOSIS, null),
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

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_PRATER, null),
  Object.keys({ CONSENSUS_CLIENT_PRATER })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_PRATER, null),
  Object.keys({ EXECUTION_CLIENT_PRATER })[0]
);

export const mevBoostPrater = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_PRATER, false),
  Object.keys({ MEVBOOST_PRATER })[0]
);

// Holesky

const CONSENSUS_CLIENT_HOLESKY = "consensus-client-holesky";
const EXECUTION_CLIENT_HOLESKY = "execution-client-holesky";
const MEVBOOST_HOLESKY = "mevboost-holesky";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_HOLESKY, null),
  Object.keys({ CONSENSUS_CLIENT_HOLESKY })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_HOLESKY, null),
  Object.keys({ EXECUTION_CLIENT_HOLESKY })[0]
);

export const mevBoostHolesky = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_HOLESKY, false),
  Object.keys({ MEVBOOST_HOLESKY })[0]
);

// LUKSO

const CONSENSUS_CLIENT_LUKSO = "consensus-client-lukso";
const EXECUTION_CLIENT_LUKSO = "execution-client-lukso";
const MEVBOOST_LUKSO = "mevboost-lukso";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_LUKSO, null),
  Object.keys({ CONSENSUS_CLIENT_LUKSO })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_LUKSO, null),
  Object.keys({ EXECUTION_CLIENT_LUKSO })[0]
);

export const mevBoostLukso = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_LUKSO, false),
  Object.keys({ MEVBOOST_LUKSO })[0]
);

// Ephemery

const CONSENSUS_CLIENT_EPHEMERY = "consensus-client-ephemery";
const EXECUTION_CLIENT_EPHEMERY = "execution-client-ephemery";
const MEVBOOST_EPHEMERY = "mevboost-ephemery";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientEphemery = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_EPHEMERY, null),
  Object.keys({ CONSENSUS_CLIENT_EPHEMERY })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientEphemery = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_EPHEMERY, null),
  Object.keys({ EXECUTION_CLIENT_EPHEMERY })[0]
);

export const mevBoostEphemery = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_EPHEMERY, false),
  Object.keys({ MEVBOOST_EPHEMERY })[0]
);
