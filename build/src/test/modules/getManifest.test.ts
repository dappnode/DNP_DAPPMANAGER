import "mocha";
import { expect } from "chai";
import { Manifest } from "../../src/types";
import { mockManifest } from "../testUtils";
const proxyquire = require("proxyquire").noCallThru();

interface DbInstance {
  [key: string]: any;
}

function getGetManifest(
  manifest: Manifest,
  sampleHash: string,
  dbInstance: DbInstance
) {
  const db = {
    get: (key: string) => dbInstance[key],
    set: (key: string, val: any) => (dbInstance[key] = val)
  };
  const { default: getManifest } = proxyquire("../../src/modules/getManifest", {
    "../modules/downloadManifest": async () => manifest,
    "../modules/apm": {
      getRepoHash: async () => sampleHash
    },
    "../db": db
  });
  return getManifest;
}

const name = "test.dnp.dappnode.eth";
const sampleHash = "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD";

const manifest: Manifest = {
  ...mockManifest,
  name,
  version: "0.1.8",
  type: "service",
  image: {
    ...mockManifest.image,
    hash: sampleHash
  }
};

describe("Get manifest", function() {
  const dbInstance: { [key: string]: any } = {};

  // Encapsulated proxyrequire
  const getManifest = getGetManifest(manifest, sampleHash, dbInstance);

  const packageReq = {
    name: name,
    ver: "0.2.1"
  };

  it("should return a parsed manifest and cache it", async () => {
    const res = await getManifest(packageReq);

    expect(res).to.deep.equal({
      origin: null,
      ...manifest
    });

    expect(dbInstance).to.deep.equal({
      "test-dnp-dappnode-eth-0-2-1":
        "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
    });
  });
});

describe("Get manifest, test cache", function() {
  const dbInstance: { [key: string]: any } = {};

  // Encapsulated proxyrequire
  const getManifest = getGetManifest(manifest, sampleHash, dbInstance);

  const packageReq = {
    name: name,
    ver: "latest"
  };

  it("Should call getManifest and not store anything in the db", async () => {
    await getManifest(packageReq);
    expect(dbInstance).to.deep.equal({});
  });
});
