import { Diagnose } from "../types";
import { diagnoseSchema, diagnoseSample } from "../schemas";

export const route = "diagnose.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = Diagnose;

export const returnDataSchema = diagnoseSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = diagnoseSample;
