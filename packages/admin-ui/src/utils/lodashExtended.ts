import { transform, isEqual, isObject, isEmpty } from "lodash";

export function difference<T>(base: T, object: T): T {
  function changes(base: any, object: any) {
    return transform(
      object,
      (result: any, value, key) => {
        if (!isEqual(value, base[key])) {
          result[key] =
            isObject(value) && isObject(base[key])
              ? changes(base[key], value)
              : value;
        }
      },
      {}
    );
  }
  return changes(base, object);
}

/**
 * Checks if an object is empty recursively
 * Empty:     { a: { aa: {} },         b: { bb: {} }, c: {} }
 * Not empty: { a: { aa: { aaa: 1 } }, b: { bb: {} }, c: {} }
 */
export function isDeepEmpty(value: any) {
  function areValuesEmpty(object: any): boolean {
    return Object.values(object).every(val => {
      if (!isObject(val)) return false;
      if (isEmpty(val)) return true;
      return areValuesEmpty(val);
    });
  }
  if (isEmpty(value)) return true;
  return areValuesEmpty(value);
}
