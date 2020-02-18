// Setup schema types
export type SetupSchema = any;
export type SetupUiJson = {
  [propId: string]: {
    "ui:widget"?: "password";
  };
  // SetupUiJson is a legacy non-critical type that needs to exist and be
  // different from any so await Promise.all([ ... ]) can work
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  "ui:order"?: string[];
};
