import { AutoUpdateDataView } from "../types";
import { autoUpdateDataViewSchema, autoUpdateDataViewSample } from "../schemas";

export const route = "autoUpdateDataGet.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = AutoUpdateDataView;

export const returnDataSchema = autoUpdateDataViewSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = autoUpdateDataViewSample;
