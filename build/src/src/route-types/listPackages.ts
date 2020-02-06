import { PackageContainer } from "../types";
import { installedDnpsSchema, installedDnpsSample } from "../schemas";

export const route = "listPackages.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = PackageContainer[];

export const returnDataSchema = installedDnpsSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = installedDnpsSample;
