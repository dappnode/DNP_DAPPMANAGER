import params from "../params";
import dbFactory from "./dbFactory";

// Initialize db
const db = dbFactory(params.DB_CACHE_PATH || "./dappmanagerdbcache.json");
export const staticKey = db.staticKey;
export const dynamicKeyValidate = db.dynamicKeyValidate;
export const clearDb = db.clearDb;
