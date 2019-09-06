import "mocha";
import { expect } from "chai";
import { Manifest, PackageRequest } from "../../src/types";
import { mockManifest } from "../testUtils";
import * as db from "../../src/db";
const proxyquire = require("proxyquire").noCallThru();

function getGetManifest(
  manifest: Manifest,
  sampleHash: string
): (req: PackageRequest) => Promise<Manifest> {
  const { default: getManifest } = proxyquire("../../src/modules/getManifest", {
    "../modules/downloadManifest": async (): Promise<Manifest> => manifest,
    "../modules/apm": {
      getRepoHash: async (): Promise<string> => sampleHash
    }
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
  beforeEach("Clean db", () => {
    db.clearDb();
  });

  it("should return a parsed manifest and cache it", async () => {
    // Encapsulated proxyrequire
    const getManifest = getGetManifest(manifest, sampleHash);

    const packageReq = {
      name: name,
      ver: "0.2.1"
    };

    const res = await getManifest(packageReq);

    expect(res).to.deep.equal({
      origin: null,
      ...manifest
    });

    expect(db.getEntireDb()).to.deep.equal({
      "test-dnp-dappnode-eth-0-2-1":
        "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
    });
  });

  it("Should call getManifest and not store anything in the db", async () => {
    // Encapsulated proxyrequire
    const getManifest = getGetManifest(manifest, sampleHash);

    const packageReq = {
      name: name,
      ver: "latest"
    };

    await getManifest(packageReq);
    expect(db.getEntireDb()).to.deep.equal({});
  });
});
