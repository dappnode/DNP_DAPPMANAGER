import { MountpointData } from "../types";
import { mountpointsDataSchema, mountpointsDataSample } from "../schemas";

export const route = "mountpointsGet.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = MountpointData[];

export const returnDataSchema = mountpointsDataSchema;

// Samples for testing

export const returnDataSample: ReturnData = mountpointsDataSample;
