import { mapValues, isObject } from "lodash";

interface AnyObject {
  [key: string]: any;
}

function applyRecursivelyToStrings(
  stringModifier: (value: string, key: string) => string
) {
  return function objectModifier(obj: any): any {
    return mapValues(obj, (value, key) => {
      if (typeof value === "string") return stringModifier(value, key);
      else if (isObject(value)) return objectModifier(value);
      else return value;
    });
  };
}

export const trimBase64Values = applyRecursivelyToStrings(
  value => value.split(";base64,")[0]
);

export const hideSensitiveValues = applyRecursivelyToStrings((value, key) => {
  const keyLowercase = key.toLowerCase();
  if (
    keyLowercase.includes("password") ||
    keyLowercase.includes("secret") ||
    keyLowercase.includes("private")
  )
    return "**********";
  return value;
});

export function limitObjValuesSize(
  obj: { [key: string]: object | string },
  maxLen: number
): { [key: string]: object | string } {
  if (!obj || typeof obj !== "object") return obj;
  return mapValues(obj, (value: object | string) => {
    try {
      const s =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return s.length > maxLen ? s.slice(0, maxLen) : value;
    } catch (e) {
      return value;
    }
  });
}

/**
 * Alias for JSON.stringify(obj, null, 2)
 */
export function stringify(obj: any) {
  return JSON.stringify(obj, null, 2);
}
