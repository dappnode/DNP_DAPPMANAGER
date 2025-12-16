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

// Hoodi

const CONSENSUS_CLIENT_HOODI = "consensus-client-hoodi";
const EXECUTION_CLIENT_HOODI = "execution-client-hoodi";
const MEVBOOST_HOODI = "mevboost-hoodi";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientHoodi = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_HOODI, null),
  Object.keys({ CONSENSUS_CLIENT_HOODI })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientHoodi = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_HOODI, null),
  Object.keys({ EXECUTION_CLIENT_HOODI })[0]
);

export const mevBoostHoodi = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_HOODI, false),
  Object.keys({ MEVBOOST_HOODI })[0]
);

// Sepolia

const CONSENSUS_CLIENT_SEPOLIA = "consensus-client-sepolia";
const EXECUTION_CLIENT_SEPOLIA = "execution-client-sepolia";
const MEVBOOST_SEPOLIA = "mevboost-sepolia";

// Null means not set
// Undefined means its set but the user has not selected any value
export const consensusClientSepolia = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(CONSENSUS_CLIENT_SEPOLIA, null),
  Object.keys({ CONSENSUS_CLIENT_SEPOLIA })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const executionClientSepolia = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(EXECUTION_CLIENT_SEPOLIA, null),
  Object.keys({ EXECUTION_CLIENT_SEPOLIA })[0]
);

export const mevBoostSepolia = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(MEVBOOST_SEPOLIA, false),
  Object.keys({ MEVBOOST_SEPOLIA })[0]
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

// Starknet (L2)

const STARKNET_NODE = "starknet-node";
const STARKNET_SIGNER = "starknet-signer";

// Null means not set
// Undefined means its set but the user has not selected any value
export const starknetNode = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(STARKNET_NODE, null),
  Object.keys({ STARKNET_NODE })[0]
);

// Null means not set
// Undefined means its set but the user has not selected any value
export const starknetSigner = interceptGlobalEnvOnSet(
  dbMain.staticKey<string | undefined | null>(STARKNET_SIGNER, null),
  Object.keys({ STARKNET_SIGNER })[0]
);
