import "mocha";
import { expect } from "chai";
import { mockHash } from "../../testUtils.js";
import { isIpfsHash } from "../../../src/utils.js";

describe("isIpfsHash", () => {
  const validHashes = [
    mockHash,
    "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
    "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
    "/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
    "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
  ];

  for (const hash of validHashes) {
    it(`valid hash ${hash}`, () => {
      expect(isIpfsHash(hash)).to.equal(true);
    });
  }
});
