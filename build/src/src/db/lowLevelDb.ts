import params from "../params";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import * as validate from "../utils/validate";

// Define dbPath and make sure it exists (mkdir -p)
const dbPath = params.DB_PATH || "./dappmanagerdb.json";
validate.path(dbPath);

// Initialize db
const adapter = new FileSync(dbPath);
const db = low(adapter);

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function get(key: string): any | null {
  if (key) return db.get(formatKey(key)).value();
}

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function set(key: string, value: any): void {
  return db.set(formatKey(key), value).write();
}

function remove(key: string): void {
  db.unset(formatKey(key)).write();
}

export function clearDb(): void {
  db.setState({});
}

// Format keys to make sure they are consistent
function formatKey(key: string): string {
  // Check if key exist before calling String.prototype
  if (!key) return key;
  if (key.includes("ipfs/")) return key.split("ipfs/")[1];
  return key;
}

/**
 * Util to format keys to make them subprops at the object level
 * firstKey.secondKey wil become in the db:
 * {
 *   firstKey: {
 *     secondKey: "value"
 *   }
 * }
 */
export function joinWithDot(key1: string, key2: string): string {
  return [key1, key2].join(".");
}

/**
 * Convert "0.2.5" to "0-2-5". `MUST` be applied to any key that
 * may contain the dot character "."
 */
export function stripDots(string: string): string {
  return string.split(".").join("-");
}

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
// function getEntireDb(): any {
//   return Object.freeze(JSON.parse(JSON.stringify(db.getState())));
// }

/**
 * Factory methods
 */

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function staticKey<T>(key: string, defaultValue: T) {
  return {
    get: (): T => get(key) || defaultValue,
    set: (newValue: T): void => set(key, newValue)
  };
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function dynamicKeyValidate<T, K>(
  keyGetter: (keyArg: K) => string,
  validate: (keyArg: K, value?: T) => boolean
) {
  return {
    get: (keyArg: K): T | null => {
      const value = get(keyGetter(keyArg));
      if (validate(keyArg, value)) return value;
      else return null;
    },
    set: (keyArg: K, newValue: T): void => {
      if (validate(keyArg, newValue)) set(keyGetter(keyArg), newValue);
    },
    remove: (keyArg: K): void => {
      remove(keyGetter(keyArg));
    }
  };
}

const ARE_ENV_FILES_MIGRATED = "areEnvFilesMigrated";

export function setAreEnvFilesMigrated(areEnvFilesMigrated: boolean): void {
  set(ARE_ENV_FILES_MIGRATED, areEnvFilesMigrated);
}
export function getAreEnvFilesMigrated(): boolean {
  return get(ARE_ENV_FILES_MIGRATED);
}
