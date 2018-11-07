const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbPath = process.env.DB_PATH || './dappmanagerdb.json';

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
 * await db.set('user.name', 'dappnode')
  .write()
 * > Write the value in the key
 * await db.get()
 * > Return the whole db
 * await db.get(key)
 * > Return the content of that key
 */

const get = async (key) => {
    if (key) {
        return db.get(key).value();
    } else {
        return db.getState();
    }
};

const set = async (key, value) => {
    return db.set(key, value).write();
};

module.exports = {
    set,
    get,
};
