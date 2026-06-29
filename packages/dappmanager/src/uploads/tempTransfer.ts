import fs from "fs";
import path from "path";
import crypto from "crypto";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

export const tempTransferDir = params.TEMP_TRANSFER_DIR;
export const UPLOAD_TTL_MS = 15 * 60 * 1000;
export const MAX_UPLOAD_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export function createFileTransferId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function ensureTempTransferDir(): void {
  fs.mkdirSync(tempTransferDir, { recursive: true });
}

export function getTempTransferPath(fileId: string): string {
  return path.join(tempTransferDir, fileId);
}

export function getTempTransferPartPath(fileId: string): string {
  return path.join(tempTransferDir, `${fileId}.part`);
}

export function registerTempTransferFile(fileId: string, filePath: string): void {
  db.fileTransferPath.set(fileId, filePath);
  scheduleFileCleanup(fileId, filePath);
}

export function scheduleFileCleanup(fileId: string, filePath: string): void {
  const timer = setTimeout(() => {
    db.fileTransferPath.remove(fileId);
    fs.unlink(filePath, (errFs) => {
      if (errFs && errFs.code !== "ENOENT") {
        logs.error(`Error deleting uploaded file ${filePath}: ${errFs.message}`);
      }
    });
  }, UPLOAD_TTL_MS);
  timer.unref?.();
}
