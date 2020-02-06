import { DirectoryItem } from "../types";
import { directoryDnpsSchema, directoryDnpsSample } from "../schemas";

export const route = "fetchDirectory.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = DirectoryItem[];

export const returnDataSchema = directoryDnpsSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = directoryDnpsSample;
