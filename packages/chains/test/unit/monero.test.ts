import { expect } from "chai";
import sinon from "sinon";
import type { InstalledPackageData } from "@dappnode/types";
import { monero } from "../../src/drivers/monero.js";

describe("Watchers > chains > monero", () => {
  const dnp = {
    containers: [{ dnpName: "monero.dnp.dappnode.eth", serviceName: "monero" }]
  } as InstalledPackageData;

  afterEach(() => sinon.restore());

  it("requests get_info and reports synchronization progress", async () => {
    const request = sinon
      .stub(globalThis, "fetch")
      .resolves(Response.json({ result: { height: 80, target_height: 100 } }));

    expect(await monero(dnp)).to.deep.equal({
      syncing: true,
      error: false,
      message: "Blocks synced: 80 / 100",
      progress: 0.8
    });
    expect(request.firstCall.args[0]).to.equal("http://monero.dappnode:18081/json_rpc");
    expect(request.firstCall.args[1]?.method).to.equal("POST");
    expect(JSON.parse(request.firstCall.args[1]?.body as string)).to.deep.equal({
      jsonrpc: "2.0",
      id: "dappnode_monitoring",
      method: "get_info",
      params: []
    });
  });

  it("reports a synchronized daemon", async () => {
    sinon.stub(globalThis, "fetch").resolves(Response.json({ result: { height: 100, target_height: 100 } }));

    expect(await monero(dnp)).to.deep.equal({ syncing: false, error: false, message: "Synced #100" });
  });

  for (const [name, response, message] of [
    ["HTTP errors", new Response(null, { status: 503 }), "Monero RPC request failed: 503"],
    ["RPC errors", Response.json({ error: { message: "Daemon unavailable" } }), "Daemon unavailable"],
    ["missing results", Response.json({}), "Monero RPC response has no result"]
  ] as const) {
    it(`rejects ${name}`, async () => {
      sinon.stub(globalThis, "fetch").resolves(response);
      let error: Error | undefined;
      try {
        await monero(dnp);
      } catch (err) {
        error = err as Error;
      }
      expect(error?.message).to.equal(message);
    });
  }
});
