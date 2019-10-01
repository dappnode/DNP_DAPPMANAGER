import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import * as validate from "../utils/validate";
import { formatKey } from "./dbUtils";

export interface Db {
  get(key: string): any | null;
  set(key: string, value: any): void;
  remove(key: string): void;
  clearDb(): void;
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export default function dbFactory(dbPath: string) {
  // Define dbPath and make sure it exists (mkdir -p)
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

  function del(key: string): void {
    db.unset(formatKey(key)).write();
  }

  function clearDb(): void {
    db.setState({});
  }

  /**
   * Factory methods
   */

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  function staticKey<T>(key: string, defaultValue: T) {
    return {
      get: (): T => get(key) || defaultValue,
      set: (newValue: T): void => set(key, newValue)
    };
  }

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  function dynamicKeyValidate<T, K>(
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
        del(keyGetter(keyArg));
      }
    };
  }

  // DB returns are of unkown type. External methods below are typed
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  // function getEntireDb(): any {
  //   return Object.freeze(JSON.parse(JSON.stringify(db.getState())));
  // }

  return {
    staticKey,
    dynamicKeyValidate,
    clearDb,
    lowLevel: { get, set, del, clearDb }
  };
}
