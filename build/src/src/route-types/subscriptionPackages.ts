import { PackageContainer } from "../types";
import { installedDnpsSchema, installedDnpsSample } from "../schemas";

export const route = "packages.dappmanager.dnp.dappnode.eth";

export type ReturnData = PackageContainer[];

export const returnDataSchema = installedDnpsSchema;

// Samples for testing

export const returnDataSample: ReturnData = installedDnpsSample;
