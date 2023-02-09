import { mapValues, isObject } from "lodash-es";

// Generic object, requires use of any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericObject = { [key: string]: any };

export function applyRecursivelyToStringValues(
  stringModifier: (value: string, key: string) => string
) {
  return function objectModifier<T extends GenericObject>(
    obj: T | T[]
  ): T | T[] {
    if (typeof obj === "object") {
      if (Array.isArray(obj)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return obj.map(objectModifier) as any;
      } else {
        return mapValues(obj, (value, key) => {
          if (typeof value === "string") return stringModifier(value, key);
          else if (isObject(value)) return objectModifier(value);
          // Fix Typescript error casting value to any
          // Type 'string | T[keyof T]' is not assignable to type 'T[P]'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          else return value as any;
        });
      }
    } else {
      return obj;
    }
  };
}
