import { expect } from "chai";
import { getLocalAvatarUrl } from "../../src/list/parseContainerInfo.js";

describe("getLocalAvatarUrl", () => {
  it("versions a stable local avatar path with its IPFS reference", () => {
    const first = getLocalAvatarUrl("example.dnp.dappnode.eth", "/ipfs/QmFirst");
    const updated = getLocalAvatarUrl("example.dnp.dappnode.eth", "/ipfs/QmUpdated");

    expect(first).to.equal("/avatars/example.dnp.dappnode.eth.png?v=%2Fipfs%2FQmFirst");
    expect(updated).to.equal("/avatars/example.dnp.dappnode.eth.png?v=%2Fipfs%2FQmUpdated");
    expect(updated).to.not.equal(first);
  });

  it("versions mirror avatars with the complete source URL", () => {
    expect(getLocalAvatarUrl("example.dnp.dappnode.eth", "https://mirror.test/CID/avatar.png")).to.equal(
      "/avatars/example.dnp.dappnode.eth.png?v=https%3A%2F%2Fmirror.test%2FCID%2Favatar.png"
    );
  });
});
