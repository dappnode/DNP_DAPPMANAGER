import _Ajv from "ajv";

const Ajv = _Ajv as unknown as typeof _Ajv.default;

// TODO: fix once upstream issue is fixed
// https://github.com/ajv-validator/ajv/issues/2132

export const ajv = new Ajv({
  strict: false,
  logger: false,
  allErrors: true,
  coerceTypes: true,
  verbose: true
});
