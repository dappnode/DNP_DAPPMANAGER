import { dbCache } from "./dbFactory";
import { PackageVersionData } from "../types";
import { dbKeys } from "./dbUtils";

export const versionDataVpn = dbCache.staticKey<PackageVersionData>(
  dbKeys.VERSION_DATA_VPN,
  {}
);
