import "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import {
  Content,
  EthForwardError,
  EthForwardErrorCode,
  Location
} from "../../../src/api/middlewares/ethForward/types";
import { resolveDomain } from "../../../src/api/middlewares/ethForward/resolveDomain";

/**
 * The purpose of this test is to make sure it retrieves the correct content
 * using the correct ENS access method
 *
 * [NOTE] tests are specified in the `endDomains` object = {
 *   "domain-to-test": "expected content to be returned"
 * }
 */

describe("ethForward > resolveDomain", () => {
  const provider = new ethers.providers.InfuraProvider();

  describe("resolveDomain with stable mainnet domains", () => {
    const ensDomains: { [hash: string]: Content } = {
      "decentral.eth": {
        location: "ipfs",
        hash: "QmXufxJH2a14QcWdvaHq3PMmFLK8xmCXoD68NVaxchSEVi"
      },
      "mycrypto.dappnode.eth": {
        location: "ipfs",
        hash: "Qmdojo8KAsZu7XTkETYwSiZMCjdUa58YNZCUKmsZ21i8gV"
      },
      "eth2dai.eduadiez.eth": {
        location: "ipfs",
        hash: "QmZoHo1wi4G9VHX6xLmMBRdFpdHMkHnsqVXqV6Vsng9m8j"
      }
    };

    const provider = new ethers.providers.InfuraProvider();

    for (const [domain, expectedContent] of Object.entries(ensDomains)) {
      it(`should return the IPFS hash of ${domain}`, async () => {
        const content = await resolveDomain(domain, provider);
        expect(content).to.deep.equal(expectedContent, "Wrong content");
      });
    }
  });

  describe("resolveDomain with variable mainnet bzz domains", () => {
    const ensDomains: string[] = ["theswarm.eth"];
    const expectedLocation: Location = "swarm";

    for (const domain of ensDomains) {
      it(`should return the IPFS hash of ${domain}`, async () => {
        const { location, hash } = await resolveDomain(domain, provider);
        expect(location).to.equal(expectedLocation, "Wrong location");
        // hash = "7027b30fa1702e5badb0d5a0378e01566da7798c9b2bf054b7e1f3168480ef96"
        expect(hash, "Hash must be a 32 bytes hex").to.match(
          /^([A-Fa-f0-9]{64})$/
        );
      });
    }
  });

  // Not using a testCases + for loop construction since the assertion logic
  // for each case is too different
  describe("resolveDomain should error for wrong domains", () => {
    const ensDomains: { [hash: string]: EthForwardErrorCode } = {
      "my.admin.dnp.dappnode.eth": "RESOLVERNOTFOUND"
    };

    const provider = new ethers.providers.InfuraProvider();

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
