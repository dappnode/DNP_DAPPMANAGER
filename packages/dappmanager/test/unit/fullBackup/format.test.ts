import crypto from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { expect } from "chai";
import {
  BackupDecryptionError,
  createDecryptStream,
  createEncryptStream,
  decodeHeader,
  EncryptOptions,
  HEADER_LENGTH
} from "../../../src/fullBackup/format.js";

// Cheap parameters keep the test fast; production uses DEFAULT_KDF_PARAMS
const fast: EncryptOptions = { kdf: { log2N: 14, r: 8, p: 1 }, log2ChunkSize: 12 };
const password = "correct horse battery";

async function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function encrypt(plaintext: Buffer, pieceSize = 1000): Promise<Buffer> {
  const pieces: Buffer[] = [];
  for (let i = 0; i < plaintext.length; i += pieceSize) pieces.push(plaintext.subarray(i, i + pieceSize));
  const encryptStream = await createEncryptStream(password, fast);
  const out = collect(encryptStream);
  await pipeline(Readable.from(pieces), encryptStream);
  return out;
}

async function decrypt(ciphertext: Buffer, pass = password, pieceSize = 777): Promise<Buffer> {
  const pieces: Buffer[] = [];
  for (let i = 0; i < ciphertext.length; i += pieceSize) pieces.push(ciphertext.subarray(i, i + pieceSize));
  const decryptStream = createDecryptStream(pass);
  const out = collect(decryptStream);
  await pipeline(Readable.from(pieces), decryptStream);
  return out;
}

async function expectDecryptError(ciphertext: Buffer, message: RegExp, pass = password): Promise<void> {
  try {
    await decrypt(ciphertext, pass);
  } catch (e) {
    expect(e).to.be.instanceOf(BackupDecryptionError);
    expect((e as Error).message).to.match(message);
    return;
  }
  throw Error("Expected decryption to fail");
}

describe("fullBackup / format", () => {
  for (const size of [0, 1, 4095, 4096, 4097, 3 * 4096, 100_000]) {
    it(`round-trips ${size} bytes`, async () => {
      const plaintext = crypto.randomBytes(size);
      const ciphertext = await encrypt(plaintext);
      expect(ciphertext.subarray(0, 8).toString("ascii")).to.equal("DNBACKUP");
      expect((await decrypt(ciphertext)).equals(plaintext)).to.equal(true);
    });
  }

  it("does not leak plaintext and uses a fresh salt per file", async () => {
    const plaintext = Buffer.from("SECRET-".repeat(500));
    const a = await encrypt(plaintext);
    const b = await encrypt(plaintext);
    expect(a.includes(Buffer.from("SECRET-"))).to.equal(false);
    expect(a.subarray(16, 40).equals(b.subarray(16, 40))).to.equal(false);
  });

  it("rejects a wrong password", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(10_000));
    await expectDecryptError(ciphertext, /Wrong password/, "wrong password!!");
  });

  it("rejects a modified ciphertext byte", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(10_000));
    ciphertext[HEADER_LENGTH + 5 + 4096 + 16 + 5 + 10] ^= 0x01;
    await expectDecryptError(ciphertext, /corrupted or was modified/);
  });

  it("rejects modified KDF parameters in the header", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(100));
    ciphertext[11] = 9; // r
    await expectDecryptError(ciphertext, /Wrong password or corrupted/);
  });

  it("rejects a truncated file that ends on a frame boundary", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(3 * 4096 + 10));
    const firstFrameEnd = HEADER_LENGTH + 5 + 4096 + 16;
    await expectDecryptError(ciphertext.subarray(0, firstFrameEnd), /truncated/);
  });

  it("rejects a truncated file in the middle of a frame", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(10_000));
    await expectDecryptError(ciphertext.subarray(0, ciphertext.length - 3), /truncated/);
  });

  it("rejects a final flag forged onto an earlier frame", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(3 * 4096 + 10));
    const firstFrameEnd = HEADER_LENGTH + 5 + 4096 + 16;
    const forged = Buffer.from(ciphertext.subarray(0, firstFrameEnd));
    forged[HEADER_LENGTH] = 0x01;
    await expectDecryptError(forged, /Wrong password or corrupted/);
  });

  it("rejects data appended after the final frame", async () => {
    const ciphertext = await encrypt(crypto.randomBytes(100));
    await expectDecryptError(Buffer.concat([ciphertext, Buffer.from([1, 2])]), /after the end/);
  });

  it("rejects non-backup files and unsafe headers before deriving a key", () => {
    expect(() => decodeHeader(Buffer.alloc(HEADER_LENGTH))).to.throw(/Not a DAppNode backup/);
    const header = Buffer.alloc(HEADER_LENGTH);
    header.write("DNBACKUP", 0, "ascii");
    header.writeUInt8(1, 8);
    header.writeUInt8(1, 9);
    header.writeUInt8(30, 10); // N = 2^30
    header.writeUInt8(8, 11);
    header.writeUInt8(1, 12);
    header.writeUInt8(16, 13);
    expect(() => decodeHeader(header)).to.throw(/Unsupported scrypt cost/);
  });
});
