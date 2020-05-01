import { staticKey } from "./dbCache";
import { PackageVersionData } from "../common/types";

const VERSION_DATA_VPN = "version-data-vpn";

export const versionDataVpn = staticKey<PackageVersionData>(
  VERSION_DATA_VPN,
  {}
);
