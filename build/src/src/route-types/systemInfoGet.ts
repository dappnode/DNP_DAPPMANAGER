import { SystemInfo } from "../types";
import { systemInfoSchema, systemInfoSample } from "../schemas";

export const route = "systemInfoGet.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = SystemInfo;

export const returnDataSchema = systemInfoSchema;

// Samples for testing

export const returnDataSample: ReturnData = systemInfoSample;
