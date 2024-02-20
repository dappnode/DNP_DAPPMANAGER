import { expect } from "chai";
import { addDappnodePeerToLocalIpfsNode } from "../../src/addDappnodePeerToLocalIpfsNode.js";

describe.skip("Add Dappnode Peer to Local IPFS Node Test", () => {
  it("should add a DAppNode peer to the local IPFS node", async () => {
    expect(await addDappnodePeerToLocalIpfsNode()).to.not.throw();
  });
});
