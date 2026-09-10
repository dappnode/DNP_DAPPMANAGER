import fs from "fs";
import path from "path";
import { expect } from "chai";
import { dbFactory } from "../../src/dbFactory.js";
import { createIpfsGatewayDb } from "../../src/ipfsClient.js";

const testDir = "./test_files/";
const defaultGateway = "https://default.gateway";

describe("IPFS gateway database compatibility", () => {
  const dbPath = path.join(testDir, "ipfs-client-db.json");

  function createDb() {
    fs.rmSync(dbPath, { force: true });
    return createIpfsGatewayDb(dbFactory(dbPath), defaultGateway);
  }

  it("reads a legacy string-only database as a gateway list", () => {
    const db = createDb();
    db.ipfsGateway.set("https://legacy.gateway");

    expect(db.getIpfsGateways()).to.deep.equal(["https://legacy.gateway"]);
  });

  it("prefers the new gateway array over the legacy string", () => {
    const db = createDb();
    db.ipfsGateway.set("https://legacy.gateway");
    db.ipfsGateways.set(["https://primary.gateway", "https://fallback.gateway"]);

    expect(db.getIpfsGateways()).to.deep.equal(["https://primary.gateway", "https://fallback.gateway"]);
  });

  it("recovers a legacy key that was previously migrated to an array", () => {
    const db = createDb();
    db.ipfsGateway.set(["https://primary.gateway", "https://fallback.gateway"]);

    const recoveredGateways = db.getIpfsGateways();
    db.setIpfsGateways(recoveredGateways);

    expect(db.ipfsGateways.get()).to.deep.equal(["https://primary.gateway", "https://fallback.gateway"]);
    expect(db.ipfsGateway.get()).to.equal("https://primary.gateway");
  });

  it("always writes the first gateway to the legacy key as a string", () => {
    const db = createDb();

    db.setIpfsGateways(["https://primary.gateway", "https://fallback.gateway"]);

    expect(db.ipfsGateways.get()).to.deep.equal(["https://primary.gateway", "https://fallback.gateway"]);
    expect(db.ipfsGateway.get()).to.equal("https://primary.gateway");
    expect(db.ipfsGateway.get()).to.be.a("string");
  });
});
