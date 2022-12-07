import params from "../params";
import { TrustedReleaseKey } from "../types";
import { dbMain } from "./dbFactory";
import { dbKeys } from "./dbUtils";

export const releaseKeysTrusted = dbMain.staticKey<TrustedReleaseKey[]>(
  dbKeys.RELEASE_KEYS_TRUSTED,
  params.DEFAULT_RELEASE_TRUSTED_KEYS
);
