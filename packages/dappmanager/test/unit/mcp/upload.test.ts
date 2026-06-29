import fs from "fs";
import crypto from "crypto";
import { expect } from "chai";
import * as db from "@dappnode/db";
import {
  abortMcpDevImageUpload,
  appendMcpDevImageUploadChunk,
  beginMcpDevImageUpload,
  finishMcpDevImageUpload
} from "../../../src/mcp/upload.js";
import { tempTransferDir } from "../../../src/uploads/tempTransfer.js";

describe("mcp / dev image upload", () => {
  beforeEach(() => {
    db.clearCacheDb();
    fs.rmSync(tempTransferDir, { recursive: true, force: true });
  });

  afterEach(() => {
    db.clearCacheDb();
    fs.rmSync(tempTransferDir, { recursive: true, force: true });
  });

  it("stages a dev image tarball through ordered base64 chunks", async () => {
    const payload = Buffer.from("fake docker save tarball");
    const sha256 = crypto.createHash("sha256").update(payload).digest("hex");
    const upload = await beginMcpDevImageUpload({ sizeBytes: payload.length, sha256, fileName: "image.tar" });

    const first = payload.subarray(0, 9);
    const second = payload.subarray(9);

    const firstResult = await appendMcpDevImageUploadChunk({
      uploadId: upload.uploadId,
      offset: 0,
      chunkBase64: first.toString("base64")
    });
    expect(firstResult.receivedBytes).to.equal(first.length);

    const secondResult = await appendMcpDevImageUploadChunk({
      uploadId: upload.uploadId,
      offset: first.length,
      chunkBase64: second.toString("base64")
    });
    expect(secondResult.remainingBytes).to.equal(0);

    const finished = await finishMcpDevImageUpload(upload.uploadId);
    expect(finished.imageFileId).to.equal(upload.uploadId);
    expect(finished.sha256).to.equal(sha256);

    const filePath = db.fileTransferPath.get(finished.imageFileId);
    expect(filePath).to.be.a("string");
    expect(fs.readFileSync(filePath as string)).to.deep.equal(payload);
  });

  it("rejects out-of-order chunks", async () => {
    const upload = await beginMcpDevImageUpload({ sizeBytes: 4 });

    try {
      await appendMcpDevImageUploadChunk({
        uploadId: upload.uploadId,
        offset: 1,
        chunkBase64: Buffer.from("test").toString("base64")
      });
      throw new Error("expected offset rejection");
    } catch (err) {
      expect((err as Error).message).to.include("Invalid upload offset");
    } finally {
      await abortMcpDevImageUpload(upload.uploadId);
    }
  });

  it("cleans up partial data when sha256 verification fails", async () => {
    const payload = Buffer.from("payload");
    const upload = await beginMcpDevImageUpload({ sizeBytes: payload.length, sha256: "0".repeat(64) });
    await appendMcpDevImageUploadChunk({
      uploadId: upload.uploadId,
      offset: 0,
      chunkBase64: payload.toString("base64")
    });

    try {
      await finishMcpDevImageUpload(upload.uploadId);
      throw new Error("expected sha256 rejection");
    } catch (err) {
      expect((err as Error).message).to.include("sha256 mismatch");
    }

    expect(db.fileTransferPath.get(upload.uploadId)).to.equal(undefined);
  });

  it("aborts an active upload and removes its partial file", async () => {
    const payload = Buffer.from("payload");
    const upload = await beginMcpDevImageUpload({ sizeBytes: payload.length });
    await appendMcpDevImageUploadChunk({
      uploadId: upload.uploadId,
      offset: 0,
      chunkBase64: payload.toString("base64")
    });

    expect(await abortMcpDevImageUpload(upload.uploadId)).to.deep.equal({ ok: true });

    try {
      await finishMcpDevImageUpload(upload.uploadId);
      throw new Error("expected missing upload");
    } catch (err) {
      expect((err as Error).message).to.include("No active MCP upload");
    }
  });
});
