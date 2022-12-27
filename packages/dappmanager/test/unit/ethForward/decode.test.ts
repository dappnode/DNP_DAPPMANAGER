import "mocha";
import { expect } from "chai";
import { Content } from "../../../src/api/middlewares/ethForward/types";
import {
  decodeContentHash,
  decodeContent,
  decodeDnsLink
} from "../../../src/api/middlewares/ethForward/utils";

interface TestCases {
  [hash: string]: Content;
}

describe("ethForward > util > decode", () => {
  describe("decodeContentHash", () => {
    const contentHashes: TestCases = {
      "0xe30101701220aa4396c7e54ce85638b1f5a66f83b0b698a80e6ca3511ccc7e8551c6ae89ab40":
        {
          location: "ipfs",
          hash: "QmZoHo1wi4G9VHX6xLmMBRdFpdHMkHnsqVXqV6Vsng9m8j"
        }
    };

    for (const [contentHashEncoded, expectedContent] of Object.entries(
      contentHashes
    )) {
      it(`should decode ${contentHashEncoded}`, async () => {
        const content = decodeContentHash(contentHashEncoded);
        expect(content).to.deep.equal(expectedContent, "Wrong content");
      });
    }
  });

  describe("decodeContent", () => {
    const contents: TestCases = {
      "0x42ac3c26c60ffb14882d3e7fa401e791a069ef589f8d365dde7f241f1e67b095": {
        location: "swarm",
        hash: "42ac3c26c60ffb14882d3e7fa401e791a069ef589f8d365dde7f241f1e67b095"
      }
    };

    for (const [contentEncoded, expectedContent] of Object.entries(contents)) {
      it(`should decode ${contentEncoded}`, async () => {
        const content = decodeContent(contentEncoded);
        expect(content).to.deep.equal(expectedContent, "Wrong content");
      });
    }
  });

  describe("decodeDnsLink", () => {
    /**
     * CONTENT_INTERFACE_ID = '0xd8389dc5'
     * [NOTE] tests are specified in the `domains` object = {
     *   "contet-to-test": "expected IPFS hash to be returned"
     * }
     */
    const contents: TestCases = {
      "/ipfs/QmZoHo1wi4G9VHX6xLmMBRdFpdHMkHnsqVXqV6Vsng9m8j": {
        location: "ipfs",
        hash: "QmZoHo1wi4G9VHX6xLmMBRdFpdHMkHnsqVXqV6Vsng9m8j"
      }
    };

    for (const [contentEncoded, expectedContent] of Object.entries(contents)) {
      it(`should decode ${contentEncoded}`, async () => {
        const content = decodeDnsLink(contentEncoded);
        expect(content).to.deep.equal(expectedContent, "Wrong content");
      });
    }
  });
});
