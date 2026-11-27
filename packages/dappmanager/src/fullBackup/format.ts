import crypto from "crypto";
import { Transform, TransformCallback } from "stream";

/**
 * Encrypted full-backup container format (version 1)
 *
 * ```
 * header (40 bytes)
 *   magic          8  "DNBACKUP"
 *   formatVersion  1  = 1
 *   kdf            1  = 1 (scrypt)
 *   log2N          1  scrypt cost, N = 2^log2N
 *   r              1  scrypt block size
 *   p              1  scrypt parallelization
 *   log2ChunkSize  1  plaintext bytes per frame = 2^log2ChunkSize
 *   reserved       2  = 0
 *   salt          16  scrypt salt
 *   noncePrefix    8  random, nonce = noncePrefix || u32 BE frame index
 * frames, repeated until the final frame
 *   flags          1  bit 0 = final frame, other bits must be 0
 *   length         4  u32 BE ciphertext length, <= chunk size
 *   ciphertext     length
 *   tag           16  AES-256-GCM auth tag
 * ```
 *
 * Every frame is authenticated with AAD = header || flags, so the KDF
 * parameters cannot be altered, frames cannot be reordered (the index is in
 * the nonce), and truncation is detected because the final flag is required.
 * The key is derived from the user's password with scrypt; the password is
 * never stored.
 */

export const FORMAT_MAGIC = Buffer.from("DNBACKUP", "ascii");
export const FORMAT_VERSION = 1;
export const KDF_SCRYPT = 1;
export const HEADER_LENGTH = 40;
const FRAME_PREFIX_LENGTH = 5;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const FLAG_FINAL = 0x01;

export interface KdfParams {
  log2N: number;
  r: number;
  p: number;
}

/** scrypt N = 2^17, r = 8, p = 1 needs 128 MiB and takes well under a second on DAppNode hardware */
export const DEFAULT_KDF_PARAMS: KdfParams = { log2N: 17, r: 8, p: 1 };
export const DEFAULT_LOG2_CHUNK_SIZE = 16; // 64 KiB

// Bounds enforced when reading a header, so a crafted file cannot make the
// dappmanager allocate unbounded memory or CPU before authentication
const KDF_BOUNDS = { log2N: [14, 20], r: [1, 16], p: [1, 4] } as const;
const CHUNK_BOUNDS = [12, 20] as const;
const MAX_SCRYPT_MEMORY_BYTES = 1024 * 1024 * 1024;

export class BackupDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupDecryptionError";
  }
}

export interface EncryptOptions {
  kdf?: KdfParams;
  log2ChunkSize?: number;
}

interface HeaderData {
  kdf: KdfParams;
  log2ChunkSize: number;
  salt: Buffer;
  noncePrefix: Buffer;
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function assertParams(kdf: KdfParams, log2ChunkSize: number): void {
  if (!inRange(kdf.log2N, KDF_BOUNDS.log2N)) throw new BackupDecryptionError(`Unsupported scrypt cost ${kdf.log2N}`);
  if (!inRange(kdf.r, KDF_BOUNDS.r)) throw new BackupDecryptionError(`Unsupported scrypt block size ${kdf.r}`);
  if (!inRange(kdf.p, KDF_BOUNDS.p)) throw new BackupDecryptionError(`Unsupported scrypt parallelization ${kdf.p}`);
  if (!inRange(log2ChunkSize, CHUNK_BOUNDS)) throw new BackupDecryptionError(`Unsupported chunk size ${log2ChunkSize}`);
  if (scryptMemory(kdf) > MAX_SCRYPT_MEMORY_BYTES) throw new BackupDecryptionError("scrypt parameters too expensive");
}

function scryptMemory({ log2N, r, p }: KdfParams): number {
  return 128 * r * (2 ** log2N + p + 2);
}

export function encodeHeader(data: HeaderData): Buffer {
  const header = Buffer.alloc(HEADER_LENGTH);
  FORMAT_MAGIC.copy(header, 0);
  header.writeUInt8(FORMAT_VERSION, 8);
  header.writeUInt8(KDF_SCRYPT, 9);
  header.writeUInt8(data.kdf.log2N, 10);
  header.writeUInt8(data.kdf.r, 11);
  header.writeUInt8(data.kdf.p, 12);
  header.writeUInt8(data.log2ChunkSize, 13);
  header.writeUInt16BE(0, 14);
  data.salt.copy(header, 16);
  data.noncePrefix.copy(header, 32);
  return header;
}

export function decodeHeader(header: Buffer): HeaderData {
  if (header.length < HEADER_LENGTH) throw new BackupDecryptionError("File is too short to be a DAppNode backup");
  if (!header.subarray(0, 8).equals(FORMAT_MAGIC)) throw new BackupDecryptionError("Not a DAppNode backup file");
  const formatVersion = header.readUInt8(8);
  if (formatVersion !== FORMAT_VERSION) {
    throw new BackupDecryptionError(`Unsupported backup format version ${formatVersion}`);
  }
  if (header.readUInt8(9) !== KDF_SCRYPT) throw new BackupDecryptionError("Unsupported key derivation function");
  if (header.readUInt16BE(14) !== 0) throw new BackupDecryptionError("Invalid backup header");

  const kdf: KdfParams = { log2N: header.readUInt8(10), r: header.readUInt8(11), p: header.readUInt8(12) };
  const log2ChunkSize = header.readUInt8(13);
  assertParams(kdf, log2ChunkSize);

  return {
    kdf,
    log2ChunkSize,
    salt: Buffer.from(header.subarray(16, 32)),
    noncePrefix: Buffer.from(header.subarray(32, 40))
  };
}

export async function deriveKey(password: string, salt: Buffer, kdf: KdfParams): Promise<Buffer> {
  const N = 2 ** kdf.log2N;
  return new Promise((resolve, reject) =>
    crypto.scrypt(
      password.normalize("NFC"),
      salt,
      KEY_LENGTH,
      { N, r: kdf.r, p: kdf.p, maxmem: scryptMemory(kdf) + 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key))
    )
  );
}

function frameNonce(noncePrefix: Buffer, index: number): Buffer {
  if (index > 0xffffffff) throw Error("Backup too large: frame counter overflow");
  const nonce = Buffer.alloc(12);
  noncePrefix.copy(nonce, 0);
  nonce.writeUInt32BE(index, 8);
  return nonce;
}

function frameAad(header: Buffer, flags: number): Buffer {
  return Buffer.concat([header, Buffer.from([flags])]);
}

/**
 * Accumulates incoming chunks without repeated Buffer.concat on every write
 */
class ByteQueue {
  private chunks: Buffer[] = [];
  length = 0;

  push(chunk: Buffer): void {
    if (chunk.length === 0) return;
    this.chunks.push(chunk);
    this.length += chunk.length;
  }

  /** Remove and return exactly n bytes. Caller must check length first */
  shift(n: number): Buffer {
    const out = Buffer.allocUnsafe(n);
    let offset = 0;
    while (offset < n) {
      const head = this.chunks[0];
      const take = Math.min(head.length, n - offset);
      head.copy(out, offset, 0, take);
      offset += take;
      if (take === head.length) this.chunks.shift();
      else this.chunks[0] = head.subarray(take);
    }
    this.length -= n;
    return out;
  }

  peek(n: number): Buffer {
    const out = this.shift(n);
    this.chunks.unshift(out);
    this.length += n;
    return out;
  }
}

/**
 * Returns a Transform stream that encrypts everything written to it.
 * The key is derived before the stream is returned so errors surface early.
 */
export async function createEncryptStream(password: string, options: EncryptOptions = {}): Promise<Transform> {
  const kdf = options.kdf ?? DEFAULT_KDF_PARAMS;
  const log2ChunkSize = options.log2ChunkSize ?? DEFAULT_LOG2_CHUNK_SIZE;
  assertParams(kdf, log2ChunkSize);

  const salt = crypto.randomBytes(16);
  const noncePrefix = crypto.randomBytes(8);
  const header = encodeHeader({ kdf, log2ChunkSize, salt, noncePrefix });
  const key = await deriveKey(password, salt, kdf);
  const chunkSize = 2 ** log2ChunkSize;

  const queue = new ByteQueue();
  let index = 0;
  let headerWritten = false;

  function sealFrame(plaintext: Buffer, flags: number): Buffer {
    const cipher = crypto.createCipheriv("aes-256-gcm", key, frameNonce(noncePrefix, index++), {
      authTagLength: TAG_LENGTH
    });
    cipher.setAAD(frameAad(header, flags));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const prefix = Buffer.alloc(FRAME_PREFIX_LENGTH);
    prefix.writeUInt8(flags, 0);
    prefix.writeUInt32BE(ciphertext.length, 1);
    return Buffer.concat([prefix, ciphertext, cipher.getAuthTag()]);
  }

  function pushHeaderOnce(stream: Transform): void {
    if (headerWritten) return;
    stream.push(header);
    headerWritten = true;
  }

  return new Transform({
    transform(chunk: Buffer, _encoding, callback: TransformCallback) {
      try {
        pushHeaderOnce(this);
        queue.push(chunk);
        // Keep at least one byte buffered so the final frame is never empty
        // unless the whole input is empty
        while (queue.length > chunkSize) this.push(sealFrame(queue.shift(chunkSize), 0));
        callback();
      } catch (e) {
        callback(e as Error);
      }
    },
    flush(callback: TransformCallback) {
      try {
        pushHeaderOnce(this);
        this.push(sealFrame(queue.shift(queue.length), FLAG_FINAL));
        key.fill(0);
        callback();
      } catch (e) {
        callback(e as Error);
      }
    }
  });
}

/**
 * Returns a Transform stream that decrypts a backup file. It errors with
 * BackupDecryptionError if the password is wrong, the file was modified,
 * or the file is truncated.
 */
export function createDecryptStream(password: string): Transform {
  const queue = new ByteQueue();
  let header: Buffer | null = null;
  let headerData: HeaderData | null = null;
  let key: Buffer | null = null;
  let chunkSize = 0;
  let index = 0;
  let finished = false;

  function openFrames(stream: Transform): void {
    if (!key || !header || !headerData) return;
    while (queue.length >= FRAME_PREFIX_LENGTH) {
      if (finished) throw new BackupDecryptionError("Unexpected data after the end of the backup");
      const prefix = queue.peek(FRAME_PREFIX_LENGTH);
      const flags = prefix.readUInt8(0);
      const length = prefix.readUInt32BE(1);
      if ((flags & ~FLAG_FINAL) !== 0) throw new BackupDecryptionError("Invalid frame flags");
      if (length > chunkSize) throw new BackupDecryptionError("Invalid frame length");
      if (queue.length < FRAME_PREFIX_LENGTH + length + TAG_LENGTH) return;

      queue.shift(FRAME_PREFIX_LENGTH);
      const ciphertext = queue.shift(length);
      const tag = queue.shift(TAG_LENGTH);
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, frameNonce(headerData.noncePrefix, index), {
        authTagLength: TAG_LENGTH
      });
      decipher.setAAD(frameAad(header, flags));
      decipher.setAuthTag(tag);
      let plaintext: Buffer;
      try {
        plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      } catch {
        throw new BackupDecryptionError(
          index === 0 ? "Wrong password or corrupted backup file" : "Backup file is corrupted or was modified"
        );
      }
      index++;
      if (plaintext.length > 0) stream.push(plaintext);
      if (flags & FLAG_FINAL) finished = true;
    }
  }

  return new Transform({
    transform(chunk: Buffer, _encoding, callback: TransformCallback) {
      queue.push(chunk);
      if (key) {
        try {
          openFrames(this);
          return callback();
        } catch (e) {
          return callback(e as Error);
        }
      }
      if (queue.length < HEADER_LENGTH) return callback();

      try {
        header = queue.shift(HEADER_LENGTH);
        headerData = decodeHeader(header);
        chunkSize = 2 ** headerData.log2ChunkSize;
      } catch (e) {
        return callback(e as Error);
      }
      deriveKey(password, headerData.salt, headerData.kdf)
        .then((derived) => {
          key = derived;
          openFrames(this);
          callback();
        })
        .catch((e) => callback(e));
    },
    flush(callback: TransformCallback) {
      try {
        if (!header) throw new BackupDecryptionError("File is too short to be a DAppNode backup");
        openFrames(this);
        if (!finished) throw new BackupDecryptionError("Backup file is incomplete (truncated)");
        if (queue.length > 0) throw new BackupDecryptionError("Unexpected data after the end of the backup");
        key?.fill(0);
        callback();
      } catch (e) {
        callback(e as Error);
      }
    }
  });
}
