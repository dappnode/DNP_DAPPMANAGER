import { Ajv } from "ajv";

export const ajv = new Ajv({
  strict: false,
  logger: false,
  allErrors: true,
  coerceTypes: true,
  verbose: true
});
