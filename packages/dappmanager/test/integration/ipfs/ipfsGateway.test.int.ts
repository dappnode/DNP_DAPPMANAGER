import "mocha";
import { expect } from "chai";
import { mockManifestWithImage } from "../../testUtils";
import { ManifestWithImage } from "../../../src/types";
import { uploadManifestRelease } from "../../integrationSpecs/buildReleaseManifest";
import { localIpfsGateway } from "../../testIpfsUtils";
import { catCarReaderToMemory } from "../../../src/modules/ipfs/writeFileToMemory";

describe("IPFS remote", function () {
  this.timeout(100000 * 5);
  const testMockPrefix = "testmock-";
  const dnpName = testMockPrefix + "remote-gateway.dnp.dappnode.eth";
  const manifest: ManifestWithImage = {
    ...mockManifestWithImage,
    name: dnpName
  };
  let releaseHash: string;

  before(async () => {
    releaseHash = await uploadManifestRelease(manifest);
  });

  it("Should get content from IPFS gateway", async function () {
    // If the content hashed does not match the CID there is thrown an error
    const buff = await catCarReaderToMemory(localIpfsGateway, releaseHash);
    const contentParsed = JSON.parse(buff.toString());
    expect(contentParsed).to.be.ok;
  });
});
