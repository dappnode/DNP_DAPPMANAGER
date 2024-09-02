import "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import { Content, EthForwardError, EthForwardErrorCode } from "../../../src/api/middlewares/ethForward/types.js";
import { resolveDomain } from "../../../src/api/middlewares/ethForward/resolveDomain.js";

/**
 * The purpose of this test is to make sure it retrieves the correct content
 * using the correct ENS access method
 *
 * [NOTE] tests are specified in the `endDomains` object = {
 *   "domain-to-test": "expected content to be returned"
 * }
 */

describe("ethForward > resolveDomain", () => {
  describe("resolveDomain with stable mainnet domains", () => {
    const ensDomains: { [hash: string]: Content } = {
      "mycrypto.dappnode.eth": {
        location: "ipfs",
        hash: "Qmdojo8KAsZu7XTkETYwSiZMCjdUa58YNZCUKmsZ21i8gV"
      }
    };

    const provider = new ethers.InfuraProvider();

    for (const [domain, expectedContent] of Object.entries(ensDomains)) {
      it(`should return the IPFS hash of ${domain}`, async () => {
        const content = await resolveDomain(domain, provider);
        expect(content).to.deep.equal(expectedContent, "Wrong content");
      });
    }
  });

  // Not using a testCases + for loop construction since the assertion logic
  // for each case is too different
  describe("resolveDomain should error for wrong domains", () => {
    const ensDomains: { [hash: string]: EthForwardErrorCode } = {
      "my.admin.dnp.dappnode.eth": "RESOLVERNOTFOUND"
    };

    const provider = new ethers.InfuraProvider();

    for (const [domain, expectedErrorCode] of Object.entries(ensDomains)) {
      it(`should error resolving ${domain}`, async () => {
        try {
          await resolveDomain(domain, provider);
          throw Error("Did not reject");
        } catch (e) {
          if (e instanceof EthForwardError) {
            expect(e.code).to.equal(expectedErrorCode, "Wrong error code");
          } else {
            throw e;
          }
        }
      });
    }
  });
});
