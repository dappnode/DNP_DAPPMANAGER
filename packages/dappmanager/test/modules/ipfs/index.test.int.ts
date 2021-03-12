import { expect } from "chai";
import { ipfs } from "../../../src/modules/ipfs";

describe("ipfs", () => {
  describe("hash format", () => {
    // Hashes for the getting started page
    const content = "Hello and Welcome to IPFS!";
    const hashes = [
      "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
      "/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
      "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB"
    ];

    for (const hash of hashes) {
      it(`Should download getting started page from ${hash}`, async () => {
        const data = await ipfs.catString(hash);
        expect(data).to.include(content);
      });
    }
  });
});
