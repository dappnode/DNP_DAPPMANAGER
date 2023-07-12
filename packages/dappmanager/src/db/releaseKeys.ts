import params from "../params.js";
import { TrustedReleaseKey } from "@dappnode/common";
import { dbMain } from "./dbFactory.js";

const RELEASE_KEYS_TRUSTED = "release-keys-trusted";

export const releaseKeysTrusted = dbMain.staticKey<TrustedReleaseKey[]>(
  RELEASE_KEYS_TRUSTED,
  params.DEFAULT_RELEASE_TRUSTED_KEYS
);
