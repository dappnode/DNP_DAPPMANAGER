import fs from "fs";
import path from "path";
import crypto from "crypto";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { UploadResourceGuard } from "./uploadResourceGuard.js";

export const tempTransferDir = params.TEMP_TRANSFER_DIR;
export const TEMP_TRANSFER_TTL_MS = 30 * 60 * 1000;
export const MCP_UPLOAD_IDLE_TTL_MS = 30 * 60 * 1000;

export const HTTP_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
export const MCP_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
export const HTTP_UPLOAD_MAX_REQUEST_OVERHEAD_BYTES = 1024 * 1024;

export const MAX_CONCURRENT_UPLOADS = 2;
export const MAX_RESERVED_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024;
export const MIN_FREE_UPLOAD_DISK_BYTES = 1024 * 1024 * 1024;

export const uploadResourceGuard = new UploadResourceGuard({
  directory: tempTransferDir,
  maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
  maxReservedBytes: MAX_RESERVED_UPLOAD_BYTES,
  minFreeBytes: MIN_FREE_UPLOAD_DISK_BYTES
});

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
  }, TEMP_TRANSFER_TTL_MS);
  timer.unref?.();
}
