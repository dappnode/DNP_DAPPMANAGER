import { PackageDetailData } from "../types";
import { packageDetailDataSchema, packageDetailDataSample } from "../schemas";

export const route = "packageDetailDataGet.dappmanager.dnp.dappnode.eth";

export interface RequestData {
  id: string;
}

export type ReturnData = PackageDetailData;

export const requestDataSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" }
  }
};

export const returnDataSchema = packageDetailDataSchema;

// Samples for testing

export const requestDataSample: RequestData = {
  id: "name"
};

export const returnDataSample: ReturnData = packageDetailDataSample;
