import { dbMain } from "./dbFactory.js";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const FULL_BACKUP_RESTORE_HELD_STOPPED = "full-backup-restore-held-stopped";

export const importedInstallationStaticIp = dbMain.staticKey<boolean>(IMPORTED_INSTALLATION_STATIC_IP, false);

export const isVpnDbMigrated = dbMain.staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

/**
 * dnpNames of packages a full backup restore holds stopped: installed but
 * still waiting for their data, or validators left for the user to start.
 * Nothing but the restore or the user may start them
 */
export const fullBackupRestoreHeldStopped = dbMain.staticKey<string[]>(FULL_BACKUP_RESTORE_HELD_STOPPED, []);
