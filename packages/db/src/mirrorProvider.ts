import { dbMain } from "./dbFactory.js";

const MIRROR_PROVIDER_ENABLED = "mirror-provider-enabled";

export const mirrorProviderEnabled = dbMain.staticKey<boolean>(MIRROR_PROVIDER_ENABLED, false);
