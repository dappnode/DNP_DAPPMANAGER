import params from "./params";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import * as validate from "./utils/validate";

// Define dbPath and make sure it exists (mkdir -p)
const dbPath = params.DB_PATH || "./dappmanagerdb.json";
validate.path(dbPath);

// Initialize db
const adapter = new FileSync(dbPath);
const db = low(adapter);

/**
 * Methods of the exposed wrapper:
 * > All methods are ASYNCronous
 * > If db.get is called and nothing is found return empty
 * > If db.write is called and the db file doesn't exist, create one
 *
 * db.set(key, value)
 * > Write the value in the key
 * db.get()
 * > Return the whole db
 * db.get(key)
 * > Return the content of that key
 */

export function get(key?: string): any {
  if (key) return db.get(formatKey(key)).value();
  else return Object.assign({}, db.getState());
}

export function set(key: string, value: any): void {
  return db.set(formatKey(key), value).write();
}

export function remove(key: string): void {
  db.unset(formatKey(key)).write();
}

// Format keys to make sure they are consistent
function formatKey(key: string): string {
  // Check if key exist before calling String.prototype
  if (!key) return key;
  if (key.includes("ipfs/")) return key.split("ipfs/")[1];
  return key;
}

export function clearDb(): void {
  db.setState({});
}
