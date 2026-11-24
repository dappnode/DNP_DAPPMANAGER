import fs from "fs";
import path from "path";
import { params } from "@dappnode/params";
import { FullBackupPendingBackup } from "@dappnode/types";

/**
 * A backup that removed validator keys from this node is the only copy of
 * them and of their slashing protection. The download link of a backup
 * works once and expires, and the request that returns it can be lost, so a
 * copy of such a backup stays in DNCORE, where it can be downloaded again,
 * until the admin discards it. Like the download, it is encrypted with the
 * backup password, which is not stored.
 */
export function getPendingBackupDir(): string {
  return path.join(params.DNCORE_DIR, "full-backup-pending");
}

const BACKUP_FILE = /^[A-Za-z0-9._-]+\.dnbackup$/;
const infoPath = (dir: string, fileName: string): string => path.join(dir, `${fileName}.json`);

/** Copy a backup into `dir`, complete and flushed to disk, or throw leaving nothing behind */
export function keepPendingBackup(dir: string, filePath: string, info: FullBackupPendingBackup): void {
  if (!BACKUP_FILE.test(info.fileName)) throw Error(`Unexpected backup file name ${info.fileName}`);
  const target = path.join(dir, info.fileName);
  const part = `${target}.part`;
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.copyFileSync(filePath, part);
    fs.chmodSync(part, 0o600);
    const fd = fs.openSync(part, "r+");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.writeFileSync(infoPath(dir, info.fileName), JSON.stringify(info, null, 2), { mode: 0o600 });
    fs.renameSync(part, target);
  } catch (e) {
    for (const file of [part, target, infoPath(dir, info.fileName)]) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        // Nothing was written there
      }
    }
    throw Error(`Could not keep a copy of the backup on this node: ${e.message}`);
  }
}

export function listPendingBackups(dir = getPendingBackupDir()): FullBackupPendingBackup[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((fileName) => BACKUP_FILE.test(fileName))
    .map((fileName) => {
      const stats = fs.statSync(path.join(dir, fileName));
      // The file is what matters: list it even if its description is unreadable
      const fallback = { createdAt: stats.mtime.toISOString(), slashingProtectionExported: [] };
      let info: Partial<FullBackupPendingBackup> = {};
      try {
        info = JSON.parse(fs.readFileSync(infoPath(dir, fileName), "utf8"));
      } catch {
        // Listed with the fallback
      }
      return { ...fallback, ...info, fileName, sizeBytes: stats.size };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Name of a pending backup as listed in `dir`. The requested name is only
 * compared against the listing, never used to build a path, so a request
 * can only reach files that are already in the pending directory
 */
function findPendingBackup(fileName: unknown, dir: string): string {
  if (typeof fileName !== "string" || !BACKUP_FILE.test(fileName)) throw Error("Invalid backup file name");
  const kept = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => BACKUP_FILE.test(f) && f === fileName) : undefined;
  if (!kept) throw Error(`No backup named ${fileName} is kept on this node`);
  return kept;
}

/** Path of a pending backup, to download it. Throws if there is none with that name */
export function getPendingBackupPath(fileName: unknown, dir = getPendingBackupDir()): string {
  return path.join(dir, findPendingBackup(fileName, dir));
}

/** The admin has the file, or does not want it: delete the copy kept on this node */
export function discardPendingBackup(fileName: unknown, dir = getPendingBackupDir()): void {
  const kept = findPendingBackup(fileName, dir);
  fs.rmSync(path.join(dir, kept));
  fs.rmSync(infoPath(dir, kept), { force: true });
}
