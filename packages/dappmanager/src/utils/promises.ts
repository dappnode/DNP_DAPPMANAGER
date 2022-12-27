import { zipObject, keys, values } from "lodash-es";

/**
 * Object version of Promise.all(). Resolves all values in an object
 * JS version from https://stackoverflow.com/questions/29292921/how-to-use-promise-all-with-an-object-as-input
 * @param promisesObj
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function promiseAllValues<
  T extends { [key: string]: any }
>(promisesObj: { [K in keyof T]: Promise<T[K]> | undefined }): Promise<T> {
  const resolvedValues = zipObject(
    keys(promisesObj),
    await Promise.all(values(promisesObj))
  );
  return resolvedValues as T;
}
