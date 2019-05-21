const params = require("params");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const dbPath = params.DB_PATH || "./dappmanagerdb.json";

// Initialize db
const adapter = new FileSync(dbPath);
const db = low(adapter);

/**
 * Methods of the exposed wrapper:
 * > All methods are ASYNCronous
 * > If db.get is called and nothing is found return empty
 * > If db.write is called and the db file doesn't exist, create one
 *
 * await db.set(key, value)
 * > Write the value in the key
 * await db.get()
 * > Return the whole db
 * await db.get(key)
 * > Return the content of that key
 */

const get = async key => {
  if (key) {
    return db.get(formatKey(key)).value();
  } else {
    return Object.assign({}, db.getState());
  }
};

const set = async (key, value) => {
  return db.set(formatKey(key), value).write();
};

const remove = async key => {
  return db.unset(formatKey(key)).write();
};

// Format keys to make sure they are consistent
function formatKey(key) {
  // Check if key exist before calling String.prototype
  if (!key) return key;
  if (key.includes("ipfs/")) return key.split("ipfs/")[1];
  return key;
}

module.exports = {
  set,
  get,
  remove
};
