import Ajv, { ErrorObject } from "ajv";

const ajv = new Ajv({ allErrors: true });

export function getValidator<T>(
  schema: any,
  dataVar: string,
  errorHanlder: (errorMessage: string) => void
): (data: T) => T {
  const name = dataVar || schema.title || "data";
  /**
   * Special validator where it checks each item individually.
   * Instead of returning
   *   item[0].name must be a string
   *   item[1].name must be a string
   *   item[2].name must be a string
   *
   * Returns once
   *   item.name must be a string
   *
   * It also validate items one by one filtering invalids.
   * It will only throw if ALL items are invalid
   */
  if (schema.type === "array" && schema.items) {
    const validateItem = ajv.compile(schema.items);
    const itemName = schema.items.title || `${name} item`;
    return (data: T): T => {
      let errorCache = "";
      /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
      // @ts-ignore
      const validItems = data.filter(item => {
        const isValid = validateItem(item);
        if (!isValid) {
          const { errors } = validateItem;
          const errorText = formatErrors(errors, itemName);
          if (errorCache !== errorText) errorHanlder(errorCache);
          errorCache = errorText;
        }
        return isValid;
      });
      /* eslint-disable-next-line @typescript-eslint/ban-ts-ignore */
      // @ts-ignore
      if (data.length && !validItems.length) throw Error(errorCache);
      else return validItems;
    };
  } else {
    const validate = ajv.compile(schema);
    return (data: T): T => {
      if (!validate(data)) {
        const { errors } = validate;
        const prettyErrors = formatErrors(errors, name);
        throw Error(prettyErrors);
      }
      return data;
    };
  }
}

function formatErrors(
  errors: Array<ErrorObject> | null | undefined,
  dataVar: string
): string {
  return (
    "Validation error:\n" + ajv.errorsText(errors, { separator: "\n", dataVar })
  );
}
