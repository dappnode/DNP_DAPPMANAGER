import fs from "fs";
import http from "http";
import express from "express";
import { expect } from "chai";
import * as db from "@dappnode/db";
import { upload } from "../../../src/api/routes/upload.js";
import { parseHttpUploadFile, reserveHttpUploadCapacity } from "../../../src/uploads/httpUploadGuard.js";
import { ensureTempTransferDir, tempTransferDir, uploadResourceGuard } from "../../../src/uploads/tempTransfer.js";

describe("HTTP upload", () => {
  beforeEach(() => {
    db.clearCacheDb();
    fs.rmSync(tempTransferDir, { recursive: true, force: true });
  });

  afterEach(() => {
    db.clearCacheDb();
    fs.rmSync(tempTransferDir, { recursive: true, force: true });
  });

  it("streams one multipart file through the guarded parser", async () => {
    const app = express();
    app.post(
      "/upload",
      (_req, _res, next) => {
        ensureTempTransferDir();
        next();
      },
      reserveHttpUploadCapacity,
      parseHttpUploadFile,
      upload
    );

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Unable to read server address");

      const form = new FormData();
      form.append("file", new Blob(["guarded multipart payload"]), "image.tar");
      const response = await fetch(`http://127.0.0.1:${address.port}/upload`, { method: "POST", body: form });
      const fileId = await response.text();

      expect(response.status).to.equal(200);
      expect(fileId).to.match(/^[0-9a-f]{64}$/);

      const filePath = db.fileTransferPath.get(fileId);
      expect(filePath).to.be.a("string");
      expect(fs.readFileSync(filePath as string, "utf8")).to.equal("guarded multipart payload");
      expect(uploadResourceGuard.getActiveCount()).to.equal(0);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    }
  });
});
