import { UserActionLog } from "../types";
import { userActionLogsSchema, userActionLogsSample } from "../schemas";

export const route = "logUserAction.dappmanager.dnp.dappnode.eth";

export type ReturnData = UserActionLog;

export const returnDataSchema = userActionLogsSchema;

// Samples for testing

export const returnDataSample: ReturnData = userActionLogsSample;
