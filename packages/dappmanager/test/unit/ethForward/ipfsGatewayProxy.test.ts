import { expect } from "chai";
import { parseIpfsGatewayProxyReqHash } from "../../../src/api/middlewares/ethForward";

describe("IPFS gateway proxy", () => {
  describe("Parse IPFS path", () => {
    const testCases: { id: string; url: string; hash: string | null }[] = [
      { id: "Empty string", url: "", hash: null },
      { id: "Bad type", url: {} as unknown as string, hash: null },
      {
        id: "With subpath",
        url: "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
        hash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme"
      },
      {
        id: "With subpath that matches the ipfs route",
        url: "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/ipfs/readme",
        hash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/ipfs/readme"
      },
      {
        id: "Just a normal hash",
        url: "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        hash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
      },
      {
        id: "Using IP a host",
        url: "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        hash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
      }
    ];

    for (const { id, url, hash } of testCases) {
      it(id, () => {
        expect(parseIpfsGatewayProxyReqHash(url)).to.equal(hash);
      });
    }
  });
});
