import { dbMain } from "./dbFactory.js";

const NACL_SECRET_KEY = "nacl-secret-key";
const NACL_PUBLIC_KEY = "nacl-public-key";
const IDENTITY_ADDRESS = "identity.address";

export const naclSecretKey = dbMain.staticKey<string>(NACL_SECRET_KEY, "");
export const naclPublicKey = dbMain.staticKey<string>(NACL_PUBLIC_KEY, "");
export const identityAddress = dbMain.staticKey<string>(IDENTITY_ADDRESS, "");
