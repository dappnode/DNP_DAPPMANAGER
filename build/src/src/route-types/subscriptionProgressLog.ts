import { ProgressLog } from "../types";
import { progressLogSchema, progressLogSample } from "../schemas";

export const route = "log.dappmanager.dnp.dappnode.eth";

export type ReturnData = ProgressLog;

export const returnDataSchema = progressLogSchema;

// Samples for testing

export const returnDataSample: ReturnData = progressLogSample;
