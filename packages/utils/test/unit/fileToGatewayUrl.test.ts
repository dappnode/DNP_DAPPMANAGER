import { expect } from "chai";
import { fileToGatewayUrl } from "../../src/fileToGatewayUrl.js";

describe("fileToGatewayUrl", () => {
  it("routes IPFS files through the DAppManager avatar endpoint", () => {
    expect(
      fileToGatewayUrl({
        source: "ipfs",
        hash: "/ipfs/QmYwAPJzv5CZsnAzt8auVZRnGiRAAW8h7B3S3GonqfM8E7",
        size: 123
      })
    ).to.equal("/avatar/ipfs/QmYwAPJzv5CZsnAzt8auVZRnGiRAAW8h7B3S3GonqfM8E7");
  });

  it("returns an empty URL when no file is provided", () => {
    expect(fileToGatewayUrl()).to.equal("");
  });
});
