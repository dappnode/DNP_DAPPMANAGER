import { EventEmitter } from "events";
import { expect } from "chai";
import sinon from "sinon";
import type { NextFunction, Request, Response } from "express";
import { reserveHttpUploadCapacity } from "../../../src/uploads/httpUploadGuard.js";
import {
  HTTP_UPLOAD_MAX_FILE_SIZE_BYTES,
  HTTP_UPLOAD_MAX_REQUEST_OVERHEAD_BYTES,
  uploadResourceGuard
} from "../../../src/uploads/tempTransfer.js";
import { UploadResourceError } from "../../../src/uploads/uploadResourceGuard.js";

describe("HTTP upload capacity middleware", () => {
  afterEach(() => sinon.restore());

  it("requires Content-Length so disk can be reserved before parsing", () => {
    const response = new MockResponse();
    const next = sinon.spy();

    reserveHttpUploadCapacity(requestWithLength(), response as unknown as Response, next as NextFunction);

    expect(response.statusCode).to.equal(411);
    expect(response.body).to.include("Content-Length is required");
    expect(next.called).to.equal(false);
  });

  it("rejects requests too large to contain a valid 5 GiB file", () => {
    const response = new MockResponse();
    const next = sinon.spy();
    const tooLarge = HTTP_UPLOAD_MAX_FILE_SIZE_BYTES + HTTP_UPLOAD_MAX_REQUEST_OVERHEAD_BYTES + 1;

    reserveHttpUploadCapacity(requestWithLength(tooLarge), response as unknown as Response, next as NextFunction);

    expect(response.statusCode).to.equal(413);
    expect(response.body).to.include(`${HTTP_UPLOAD_MAX_FILE_SIZE_BYTES} bytes`);
    expect(next.called).to.equal(false);
  });

  it("holds shared capacity until the response finishes or closes", async () => {
    const release = sinon.spy();
    const reserve = sinon.stub(uploadResourceGuard, "reserve").resolves({ release });
    const response = new MockResponse();
    const next = sinon.spy();

    reserveHttpUploadCapacity(requestWithLength(1_024), response as unknown as Response, next as NextFunction);
    await nextEventLoopTurn();

    expect(reserve.calledOnce).to.equal(true);
    expect(reserve.firstCall.args[0]).to.include({ kind: "http", sizeBytes: 1_024 });
    expect(next.calledOnce).to.equal(true);

    response.emit("finish");
    response.emit("close");
    expect(release.calledOnce).to.equal(true);
  });

  it("returns the resource guard status without starting the parser", async () => {
    sinon.stub(uploadResourceGuard, "reserve").rejects(new UploadResourceError("Too many active uploads", 429));
    const response = new MockResponse();
    const next = sinon.spy();

    reserveHttpUploadCapacity(requestWithLength(1_024), response as unknown as Response, next as NextFunction);
    await nextEventLoopTurn();

    expect(response.statusCode).to.equal(429);
    expect(response.body).to.equal("Too many active uploads");
    expect(next.called).to.equal(false);
  });

  it("releases a reservation if the client disconnects during the disk check", async () => {
    const release = sinon.spy();
    sinon.stub(uploadResourceGuard, "reserve").resolves({ release });
    const response = new MockResponse();
    response.destroyed = true;
    const next = sinon.spy();

    reserveHttpUploadCapacity(requestWithLength(1_024), response as unknown as Response, next as NextFunction);
    await nextEventLoopTurn();

    expect(release.calledOnce).to.equal(true);
    expect(next.called).to.equal(false);
  });
});

function requestWithLength(contentLength?: number): Request {
  return {
    headers: contentLength === undefined ? {} : { "content-length": String(contentLength) }
  } as Request;
}

class MockResponse extends EventEmitter {
  statusCode = 200;
  body = "";
  destroyed = false;
  writableEnded = false;

  status(statusCode: number): this {
    this.statusCode = statusCode;
    return this;
  }

  send(body: string): this {
    this.body = body;
    return this;
  }
}

async function nextEventLoopTurn(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
