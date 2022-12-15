import "mocha";
import { expect } from "chai";
import { mockManifestWithImage } from "../../testUtils";
import { ManifestWithImage } from "../../../src/types";
import { uploadManifestRelease } from "../integrationSpecs/buildReleaseManifest";
import { uploadDirectoryRelease } from "../integrationSpecs/buildReleaseDirectory";
import { ipfs } from "../../../src/modules/ipfs";
import { getManifest } from "../../../src/modules/release/getManifest";

describe("IPFS remote", function () {
  this.timeout(100000 * 5);
  const testMockPrefix = "testmock-";
  const dnpName = testMockPrefix + "remote-gateway.dnp.dappnode.eth";
  const manifest: ManifestWithImage = {
    ...mockManifestWithImage,
    name: dnpName
  };
  let manifestHash: string;
  let dnpReleaseHash: string;

  before(async () => {
    // Upload manifest and dnp directrory
    manifestHash = await uploadManifestRelease(manifest);
    dnpReleaseHash = await uploadDirectoryRelease({
      manifest,
      compose: {
        version: "3.5",
        services: {
          [dnpName]: {
            restart: "unless-stopped"
          }
        }
      }
    });
  });

  it("Should get manifest from IPFS gateway", async function () {
    // If the content hashed does not match the CID there is thrown an error
    const buff = await ipfs.writeFileToMemory(manifestHash);
    const contentParsed = JSON.parse(buff.toString());
    expect(contentParsed).to.be.ok;
  });

  it("Should get manifest from directory using IPFS gateway", async function () {
    const manifest = await getManifest(dnpReleaseHash);
    expect(manifest).to.be.ok;
  });
});
