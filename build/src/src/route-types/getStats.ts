import { HostStats } from "../types";
import { hostStatsSchema, hostStatsSample } from "../schemas";

export const route = "getStats.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = HostStats;

export const returnDataSchema = hostStatsSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = hostStatsSample;
