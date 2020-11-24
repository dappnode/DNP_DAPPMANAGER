import { staticKey } from "./dbMain";

const NACL_SECRET_KEY = "nacl-secret-key";
const NACL_PUBLIC_KEY = "nacl-public-key";
const IDENTITY_ADDRESS = "identity.address";
const SESSIONS_SECRET_KEY = "sessions-secret-key";

export const naclSecretKey = staticKey<string>(NACL_SECRET_KEY, "");
export const naclPublicKey = staticKey<string>(NACL_PUBLIC_KEY, "");
export const identityAddress = staticKey<string>(IDENTITY_ADDRESS, "");
export const sessionsSecretKey = staticKey<string>(SESSIONS_SECRET_KEY, "");
