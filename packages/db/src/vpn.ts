import { dbCache } from "./dbFactory.js";
import { PackageVersionData } from "@dappnode/types";

const VERSION_DATA_VPN = "version-data-vpn";

export const versionDataVpn = dbCache.staticKey<PackageVersionData>(
  VERSION_DATA_VPN,
  {}
);
