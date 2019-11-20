import { UserActionLog } from "../types";
import { userActionLogsSchema, userActionLogsSample } from "../schemas";

//////////////////////////////////////////////////
// LEGACY - deprecate when migrate WAMP to REST //
//////////////////////////////////////////////////

export const route = "logUserActionToDappmanager";

export type ReturnData = UserActionLog;

export const returnDataSchema = userActionLogsSchema;

// Samples for testing

export const returnDataSample: ReturnData = userActionLogsSample;
