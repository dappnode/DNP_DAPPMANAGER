import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { createRequire } from "node:module";
import type express from "express";
import httpProxy from "http-proxy";
import { ethers } from "ethers";
import { params } from "@dappnode/params";

const require = createRequire(import.meta.url);
const HTTP = require("ipfs-utils/src/http.js");
const abi = ethers.AbiCoder.defaultAbiCoder();
const swarmHash = "42ac3c26c60ffb14882d3e7fa401e791a069ef589f8d365dde7f241f1e67b095";
const ipfsHash = "0xe30101701220aa4396c7e54ce85638b1f5a66f83b0b698a80e6ca3511ccc7e8551c6ae89ab40";

describe("ethForward > API availability", function () {
  this.timeout(6000);
  let getMiddleware: typeof import("../../../src/api/middlewares/ethForward/index.js").getEthForwardMiddleware;
  let now = Date.now();
  let send: sinon.SinonStub;
  let destroy: sinon.SinonSpy;
  let ipfsFetch: sinon.SinonStub;
  let web: sinon.SinonStub;
  let contentLocation: "swarm" | "ipfs";

  before(async () => {
    const originalHost = params.IPFS_HOST;
    params.IPFS_HOST = "https://unrelated-gateway.example";
    try {
      ({ getEthForwardMiddleware: getMiddleware } = await import("../../../src/api/middlewares/ethForward/index.js"));
    } finally {
      params.IPFS_HOST = originalHost;
    }
  });

  beforeEach(() => {
    // Expire the availability cache without waiting between requests.
    now += 11_000;
    sinon.stub(Date, "now").returns(now);
    send = sinon.stub(ethers.JsonRpcProvider.prototype, "send").resolves("test-client");
    destroy = sinon.spy(ethers.JsonRpcProvider.prototype, "destroy");
    ipfsFetch = sinon.stub(HTTP.prototype, "fetch").rejects(new Error("IPFS offline"));
    contentLocation = "swarm";
    sinon.stub(ethers.JsonRpcProvider.prototype, "call").callsFake(async (tx) => {
      const data = String(tx.data);
      switch (data.slice(0, 10)) {
        case ethers.id("resolver(bytes32)").slice(0, 10):
          return abi.encode(["address"], ["0x0000000000000000000000000000000000000001"]);
        case ethers.id("supportsInterface(bytes4)").slice(0, 10):
          return abi.encode(["bool"], [data.slice(10, 18) === (contentLocation === "swarm" ? "d8389dc5" : "bc1c58d1")]);
        case ethers.id("content(bytes32)").slice(0, 10):
          return abi.encode(["bytes32"], [`0x${swarmHash}`]);
        case ethers.id("contenthash(bytes32)").slice(0, 10):
          return abi.encode(["bytes"], [ipfsHash]);
        default:
          throw new Error(`Unexpected ENS call: ${data}`);
      }
    });
    web = sinon.stub().callsFake((_req, res, _options, callback) => {
      res.end("proxied");
      callback(undefined, {});
    });
    sinon.stub(httpProxy, "createProxyServer").returns({ on: sinon.stub(), web } as unknown as httpProxy);
  });

  afterEach(() => sinon.restore());

  function request(): Promise<string> {
    const middleware = getMiddleware();
    return new Promise((resolve, reject) => {
      let body = "";
      const req = { headers: { host: "example.eth" }, url: "/" } as express.Request;
      const res = {
        writeHead: () => undefined,
        write: (chunk: string) => {
          body += chunk;
        },
        end: (chunk = "") => resolve(body + chunk)
      } as unknown as express.Response;
      middleware(req, res, reject);
    });
  }

  it("forwards Swarm content when IPFS is unavailable", async () => {
    expect(await request()).to.equal("proxied");
    expect(web.firstCall.args[2].target).to.equal(`${params.ETHFORWARD_SWARM_REDIRECT}/${swarmHash}`);
    sinon.assert.calledOn(destroy, send.firstCall.thisValue);
  });

  it("still blocks IPFS content when its API is unavailable", async () => {
    contentLocation = "ipfs";
    expect(await request()).to.include("IPFS not available");
    sinon.assert.notCalled(web);
  });

  it("checks the forwarding backend even when IPFS_HOST points elsewhere", async () => {
    await request();
    const checkedUrl = new URL(String(ipfsFetch.firstCall.args[0]));
    expect(checkedUrl.hostname).to.equal(new URL(params.ETHFORWARD_IPFS_REDIRECT).hostname);
    expect(checkedUrl.port).to.equal("5001");
    expect(checkedUrl.pathname).to.equal("/api/v0/id");
  });

  it("destroys the Ethereum provider after an RPC failure", async () => {
    send.rejects(new Error("Ethereum offline"));
    expect(await request()).to.include("Ethereum and IPFS not available");
    sinon.assert.calledOn(destroy, send.firstCall.thisValue);
    expect(send.firstCall.thisValue.destroyed).to.equal(true);
    sinon.assert.notCalled(web);
  });

  it("destroys the Ethereum provider after an RPC timeout", async () => {
    send.returns(new Promise(() => undefined));
    expect(await request()).to.include("Ethereum and IPFS not available");
    sinon.assert.calledOn(destroy, send.firstCall.thisValue);
    expect(send.firstCall.thisValue.destroyed).to.equal(true);
    sinon.assert.notCalled(web);
  });
});
