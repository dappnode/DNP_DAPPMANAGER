import { SetupSchemaAllDnps } from "types";

// Setup schema types
export type SetupSchema = any;
export type SetupUiJson = any;

export interface SetupSchemaAllDnpsFormated {
  type: "object";
  properties: SetupSchemaAllDnps;
}
