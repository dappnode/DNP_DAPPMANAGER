import { staticKey } from "./dbMain";

const NACL_SECRET_KEY = "nacl-secret-key";
const NACL_PUBLIC_KEY = "nacl-public-key";
const IDENTITY_ADDRESS = "identity.address";

export const naclSecretKey = staticKey<string>(NACL_SECRET_KEY, "");
export const naclPublicKey = staticKey<string>(NACL_PUBLIC_KEY, "");
export const identityAddress = staticKey<string>(IDENTITY_ADDRESS, "");
