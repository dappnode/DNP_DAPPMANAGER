import "mocha";
import { expect } from "chai";
import { Manifest, ApmVersion } from "../../src/types";
import { mockManifest } from "../testUtils";
import * as db from "../../src/db";
import rewiremock from "rewiremock";

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
async function mockGetManifest(manifest: Manifest, sampleHash: string) {
  async function downloadManifestMock(): Promise<Manifest> {
    return manifest;
  }

  async function getVersion(
    dnpName: string,
    version: string
  ): Promise<ApmVersion> {
    dnpName;
    version;
    return {
      version: "0.2.4",
      contentUri: sampleHash
    };
  }

  const mock = await rewiremock.around(
    () => import("../../src/modules/release/getManifest"),
    mock => {
      mock(() => import("../../src/modules/release/ipfs/downloadManifest"))
        .withDefault(downloadManifestMock)
        .toBeUsed();
      mock(() => import("../../src/modules/release/getVersions"))
        .with({ getVersion })
        .toBeUsed();
    }
  );
  return mock.default;
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

  it("should return a parsed manifest NOT cache it", async () => {
    // Encapsulated proxyrequire
    const getManifest = await mockGetManifest(manifest, sampleHash);

    const res = await getManifest({ name, ver: "0.2.1" });

    expect(res).to.deep.equal({
      origin: null,
      ...manifest
    });

    expect(db.getEntireDb()).to.deep.equal({});
  });

  it("Should call getManifest and not store anything in the db", async () => {
    // Encapsulated proxyrequire
    const getManifest = await mockGetManifest(manifest, sampleHash);

    await getManifest({ name, ver: "latest" });
    expect(db.getEntireDb()).to.deep.equal({});
  });
});
