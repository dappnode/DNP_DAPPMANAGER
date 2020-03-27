import { staticKey } from "./dbMain";
import { UiWelcomeStatus } from "../types";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const UI_WELCOME_STATUS = "ui-welcome-status";

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

export const uiWelcomeStatus = staticKey<UiWelcomeStatus>(
  UI_WELCOME_STATUS,
  "pending"
);
