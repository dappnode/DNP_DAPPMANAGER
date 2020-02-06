import { VolumeData } from "../types";
import { volumesDataSample, volumeDataSchema } from "../schemas";

export const route = "volumes.dappmanager.dnp.dappnode.eth";

export type ReturnData = VolumeData[];

export const returnDataSchema = volumeDataSchema;

// Samples for testing

export const returnDataSample: ReturnData = volumesDataSample;
