import { DirectoryItem } from "../types";
import { directoryDnpsSample, directoryDnpsSchema } from "../schemas";

export const route = "directory.dappmanager.dnp.dappnode.eth";

export type ReturnData = DirectoryItem[];

export const returnDataSchema = directoryDnpsSchema;

// Samples for testing

export const returnDataSample: ReturnData = directoryDnpsSample;
