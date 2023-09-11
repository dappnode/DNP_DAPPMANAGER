import { dbMain } from "./dbFactory.js";

const OP_HISTORICAL_GETH = "op-historical-geth";
const OP_HISTORICAL_ERIGON = "op-historical-erigon";
const OP_EXECUTION_CLIENT = "op-execution-client";

export const opHistoricalGeth = dbMain.staticKey<boolean>(
  OP_HISTORICAL_GETH,
  false
);

export const opHistoricalErigon = dbMain.staticKey<boolean>(
  OP_HISTORICAL_ERIGON,
  false
);

export const opExecutionClient = dbMain.staticKey<string | null>(
  OP_EXECUTION_CLIENT,
  null
);
