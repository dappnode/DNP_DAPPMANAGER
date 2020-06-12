import params from "../params";
import dbFactory from "./dbFactory";

// Initialize db
const db = dbFactory(params.DB_MAIN_PATH || "./maindb.json");
export const staticKey = db.staticKey;
export const dynamicKeyValidate = db.dynamicKeyValidate;
export const lowLevel = db.lowLevel;
