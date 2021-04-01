import params from "../params";
import dbFactory from "./dbFactory";

// Initialize db
const db = dbFactory(params.DB_CACHE_PATH || "./dappmanagerdb.json");
export const staticKey = db.staticKey;
export const indexedByKey = db.indexedByKey;
export const lowLevel = db.lowLevel;
