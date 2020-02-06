import { VolumeData } from "../types";
import { volumeDataSchema, volumesDataSample } from "../schemas";

export const route = "volumesGet.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = VolumeData[];

export const returnDataSchema = volumeDataSchema;

// Samples for testing

export const returnDataSample: ReturnData = volumesDataSample;
