import fs from "fs";
import crypto from "crypto";
import {
  createFileTransferId,
  ensureTempTransferDir,
  getTempTransferPartPath,
  getTempTransferPath,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  registerTempTransferFile,
  UPLOAD_TTL_MS
} from "../uploads/tempTransfer.js";
import { logs } from "@dappnode/logger";

export const MCP_UPLOAD_CHUNK_BYTES = 1024 * 1024;
export const MCP_UPLOAD_CHUNK_BASE64_CHARS = Math.ceil(MCP_UPLOAD_CHUNK_BYTES / 3) * 4;

interface ActiveMcpUpload {
  uploadId: string;
  fileName?: string;
  expectedSizeBytes: number;
  expectedSha256?: string;
  receivedBytes: number;
  partPath: string;
  expiresAt: number;
  hash: crypto.Hash;
  cleanupTimer: NodeJS.Timeout;
}

interface BeginUploadArgs {
  sizeBytes: number;
  sha256?: string;
  fileName?: string;
}

interface BeginUploadResult {
  uploadId: string;
  maxChunkBytes: number;
  maxChunkBase64Chars: number;
  expiresAt: number;
}

interface AppendUploadResult {
  uploadId: string;
  receivedBytes: number;
  remainingBytes: number;
}

interface FinishUploadResult {
  imageFileId: string;
  sizeBytes: number;
  sha256: string;
  expiresInMs: number;
}

const activeUploads = new Map<string, ActiveMcpUpload>();

export async function beginMcpDevImageUpload({
  sizeBytes,
  sha256,
  fileName
}: BeginUploadArgs): Promise<BeginUploadResult> {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new Error(`sizeBytes must be between 1 and ${MAX_UPLOAD_FILE_SIZE_BYTES}`);
  }

  const expectedSha256 = normalizeSha256(sha256);
  const uploadId = createFileTransferId();
  const partPath = getTempTransferPartPath(uploadId);
  const expiresAt = Date.now() + UPLOAD_TTL_MS;

  ensureTempTransferDir();
  const handle = await fs.promises.open(partPath, "wx");
  await handle.close();

  const cleanupTimer = setTimeout(() => {
    cleanupExpiredUpload(uploadId);
  }, UPLOAD_TTL_MS);
  cleanupTimer.unref?.();

  activeUploads.set(uploadId, {
    uploadId,
    fileName,
    expectedSizeBytes: sizeBytes,
    expectedSha256,
    receivedBytes: 0,
    partPath,
    expiresAt,
    hash: crypto.createHash("sha256"),
    cleanupTimer
  });

  return {
    uploadId,
    maxChunkBytes: MCP_UPLOAD_CHUNK_BYTES,
    maxChunkBase64Chars: MCP_UPLOAD_CHUNK_BASE64_CHARS,
    expiresAt
  };
}

export async function appendMcpDevImageUploadChunk({
  uploadId,
  offset,
  chunkBase64
}: {
  uploadId: string;
  offset: number;
  chunkBase64: string;
}): Promise<AppendUploadResult> {
  const upload = await getActiveUpload(uploadId);
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("offset must be a non-negative integer");
  if (offset !== upload.receivedBytes) {
    throw new Error(`Invalid upload offset ${offset}; expected ${upload.receivedBytes}`);
  }

  const chunk = decodeBase64Chunk(chunkBase64);
  if (chunk.length === 0) throw new Error("chunkBase64 must contain at least one byte");
  if (upload.receivedBytes + chunk.length > upload.expectedSizeBytes) {
    throw new Error("Chunk would exceed declared upload size");
  }

  await fs.promises.appendFile(upload.partPath, chunk);
  upload.hash.update(chunk);
  upload.receivedBytes += chunk.length;

  return {
    uploadId,
    receivedBytes: upload.receivedBytes,
    remainingBytes: upload.expectedSizeBytes - upload.receivedBytes
  };
}

export async function finishMcpDevImageUpload(uploadId: string): Promise<FinishUploadResult> {
  const upload = await getActiveUpload(uploadId);
  if (upload.receivedBytes !== upload.expectedSizeBytes) {
    throw new Error(`Upload is incomplete: received ${upload.receivedBytes} of ${upload.expectedSizeBytes} bytes`);
  }

  const actualSha256 = upload.hash.digest("hex");
  if (upload.expectedSha256 && actualSha256 !== upload.expectedSha256) {
    await removeActiveUpload(upload, "sha256 mismatch");
    throw new Error(`sha256 mismatch: expected ${upload.expectedSha256}, got ${actualSha256}`);
  }

  const filePath = getTempTransferPath(upload.uploadId);
  await fs.promises.rename(upload.partPath, filePath);
  clearActiveUpload(upload);
  registerTempTransferFile(upload.uploadId, filePath);

  return {
    imageFileId: upload.uploadId,
    sizeBytes: upload.receivedBytes,
    sha256: actualSha256,
    expiresInMs: UPLOAD_TTL_MS
  };
}

export async function abortMcpDevImageUpload(uploadId: string): Promise<{ ok: boolean }> {
  const upload = activeUploads.get(uploadId);
  if (!upload) return { ok: false };
  await removeActiveUpload(upload, "aborted");
  return { ok: true };
}

async function getActiveUpload(uploadId: string): Promise<ActiveMcpUpload> {
  const upload = activeUploads.get(uploadId);
  if (!upload) throw new Error(`No active MCP upload found for uploadId ${uploadId}`);
  if (Date.now() > upload.expiresAt) {
    await removeActiveUpload(upload, "expired");
    throw new Error(`MCP upload ${uploadId} has expired`);
  }
  return upload;
}

function clearActiveUpload(upload: ActiveMcpUpload): void {
  clearTimeout(upload.cleanupTimer);
  activeUploads.delete(upload.uploadId);
}

async function removeActiveUpload(upload: ActiveMcpUpload, reason: string): Promise<void> {
  clearActiveUpload(upload);
  try {
    await fs.promises.unlink(upload.partPath);
  } catch (err) {
    if (!(err instanceof Error) || !("code" in err) || err.code !== "ENOENT") {
      logs.warn(`MCP upload cleanup failed for ${upload.uploadId} (${reason}): ${String(err)}`);
    }
  }
}

function cleanupExpiredUpload(uploadId: string): void {
  const upload = activeUploads.get(uploadId);
  if (!upload) return;
  removeActiveUpload(upload, "expired").catch((err) => {
    logs.warn(`MCP upload expiry cleanup failed for ${uploadId}: ${err instanceof Error ? err.message : String(err)}`);
  });
}

function normalizeSha256(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (value.length !== 64) throw new Error("sha256 must be a 64-character hex string");

  let normalized = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      normalized += value[i];
    } else if (code >= 65 && code <= 70) {
      normalized += value[i].toLowerCase();
    } else if (code >= 97 && code <= 102) {
      normalized += value[i];
    } else {
      throw new Error("sha256 must be a 64-character hex string");
    }
  }
  return normalized;
}

function decodeBase64Chunk(value: string): Buffer {
  if (value.length > MCP_UPLOAD_CHUNK_BASE64_CHARS) {
    throw new Error(`chunkBase64 exceeds max encoded size ${MCP_UPLOAD_CHUNK_BASE64_CHARS}`);
  }
  if (value.length % 4 !== 0) {
    throw new Error("chunkBase64 must be padded standard base64");
  }

  let padding = false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code === 61) {
      padding = true;
      continue;
    }
    if (padding) throw new Error("chunkBase64 padding must appear only at the end");
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isSymbol = code === 43 || code === 47;
    if (!isUpper && !isLower && !isDigit && !isSymbol) {
      throw new Error("chunkBase64 must be standard base64 without whitespace");
    }
  }

  const decoded = Buffer.from(value, "base64");
  if (decoded.length > MCP_UPLOAD_CHUNK_BYTES) {
    throw new Error(`Decoded chunk exceeds max size ${MCP_UPLOAD_CHUNK_BYTES}`);
  }
  return decoded;
}
