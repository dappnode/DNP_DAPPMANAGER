import { expect } from "chai";
import { addDappnodePeerToLocalIpfsNode } from "../../src/addDappnodePeerToLocalIpfsNode.js";

describe.only("Add Dappnode Peer to Local IPFS Node Test", () => {
  it("should add a DAppNode peer to the local IPFS node", async () => {
    const response: Response = await addDappnodePeerToLocalIpfsNode();
    expect(response.status === 200).to.be.true;

    const responseBody = await response.json();
    expect(responseBody).to.have.property("ID").that.is.a("string");
    expect(responseBody)
      .to.have.property("Status")
      .that.is.a("string")
      .and.equals("success");
  });
});
