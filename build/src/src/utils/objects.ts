import { mapValues, isObject } from "lodash";

// Generic object, requires use of any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericObject = { [key: string]: any };

export function applyRecursivelyToStringValues(
  stringModifier: (value: string, key: string) => string
) {
  return function objectModifier<T extends GenericObject>(obj: T): T {
    return mapValues(obj, (value, key) => {
      if (typeof value === "string") return stringModifier(value, key);
      else if (isObject(value)) return objectModifier(value);
      // Fix Typescript error casting value to any
      // Type 'string | T[keyof T]' is not assignable to type 'T[P]'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else return value as any;
    });
  };
}

/**
 * Alias for JSON.stringify(obj, null, 2)
 */
export function stringify(obj: GenericObject): string {
  return JSON.stringify(obj, null, 2);
}
