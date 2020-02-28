import { SystemInfo } from "../types";
import { systemInfoSchema, systemInfoSample } from "../schemas";

export const route = "systemInfo.dappmanager.dnp.dappnode.eth";

export type ReturnData = SystemInfo;

export const returnDataSchema = systemInfoSchema;

// Samples for testing

export const returnDataSample: ReturnData = systemInfoSample;
