import { AutoUpdateDataView } from "../types";
import { autoUpdateDataViewSchema, autoUpdateDataViewSample } from "../schemas";

export const route = "autoUpdateData.dappmanager.dnp.dappnode.eth";

export type ReturnData = AutoUpdateDataView;

export const returnDataSchema = autoUpdateDataViewSchema;

// Samples for testing

export const returnDataSample: ReturnData = autoUpdateDataViewSample;
