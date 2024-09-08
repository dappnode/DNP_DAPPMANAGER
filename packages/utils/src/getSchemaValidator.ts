import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

export function getSchemaValidator<T>(schema: { title: string }, dataName?: string): (data: T) => T {
  const name = dataName || schema.title || "data";
  const validate = ajv.compile(schema);
  return (data: T): T => {
    if (!validate(data)) {
      const { errors } = validate;
      throw Error(`Invalid ${name}:\n` + ajv.errorsText(errors, { separator: "\n", dataVar: name }));
    }
    return data;
  };
}
