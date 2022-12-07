import { dbMain } from "./dbFactory";
import { dbKeys } from "./dbUtils";

export const naclSecretKey = dbMain.staticKey<string>(
  dbKeys.NACL_SECRET_KEY,
  ""
);
export const naclPublicKey = dbMain.staticKey<string>(
  dbKeys.NACL_PUBLIC_KEY,
  ""
);
export const identityAddress = dbMain.staticKey<string>(
  dbKeys.IDENTITY_ADDRESS,
  ""
);
