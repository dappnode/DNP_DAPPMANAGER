import { mapValues, isObject } from "lodash";

const secretKeyRegex = /(password|passphrase|secret|private)/i;

// Generic object, requires use of any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericObject = { [key: string]: any };

function applyRecursivelyToStrings(
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

export const trimBase64Values = applyRecursivelyToStrings(
  value => value.split(";base64,")[0]
);

export const hideSensitiveValues = applyRecursivelyToStrings((value, key) => {
  return secretKeyRegex.test(key) ? "**********" : value;
});

export function limitObjValuesSize<T extends GenericObject>(
  obj: T,
  maxLen: number
): T {
  if (!obj || typeof obj !== "object") return obj;
  return mapValues(obj, value => {
    try {
      const s =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return s.length > maxLen ? s.slice(0, maxLen) : value;
    } catch (e) {
      // Fix Typescript error casting value to any
      // Type 'string | T[keyof T]' is not assignable to type 'T[P]'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return value as any;
    }
  });
}

/**
 * Alias for JSON.stringify(obj, null, 2)
 */
export function stringify(obj: GenericObject): string {
  return JSON.stringify(obj, null, 2);
}
