import "mocha";
import { expect } from "chai";
import {
  generateDyndnsIdentity,
  getDomainFromIdentityAddress,
  isPrivateKeyValid
} from "../../src/generateKeysIfNotExistOrNotValid.js";
import { ethers } from "ethers";
import { params } from "@dappnode/params";
import { updateDyndnsIpFromPrivateKey } from "../../src/updateDyndnsIp.js";

describe("Dyndns", () => {
  let identity: ethers.HDNodeWallet;

  it("Should generate a new dyndns identity", () => {
    identity = generateDyndnsIdentity();

    expect(identity).to.be.an("object");
    expect(identity).to.have.property("privateKey");
    expect(identity).to.have.property("address");
    expect(identity).to.have.property("publicKey");
  });
  it("Should validate as valid a valid private key", () => {
    const isValid = isPrivateKeyValid(identity.privateKey);
    expect(isValid).to.be.true;
  });
  it("Should validate as invalid an invalid private key", () => {
    // modify slightly the private key
    const invalidPrivateKey = identity.privateKey + "1";
    const isValid = isPrivateKeyValid(invalidPrivateKey);
    expect(isValid).to.be.false;
  });
  it("Should get a domain from an identity address", () => {
    // 4e1a38a2394acd41.dyndns.dappnode.io
    const domain = getDomainFromIdentityAddress(identity.address);
    // check it ends with .dyndns.dappnode.io
    if (!domain.endsWith(params.DYNDNS_DOMAIN)) throw new Error(`Domain does not end with: ${params.DYNDNS_DOMAIN}`);
    // check it does not start with 0x
    if (domain.startsWith("0x")) throw new Error(`Domain starts with 0x: ${domain}`);
    // it should have 35 characters
    if (domain.length !== 35) throw new Error(`Domain length is not 35: ${domain.length}`);
  });

  it("Should update a dyndns identity", async () => {
    const result = await updateDyndnsIpFromPrivateKey(identity.privateKey);
    expect(result).to.be.an("object");
    expect(result).to.have.property("ip");
    expect(result).to.have.property("domain");
    expect(result).to.have.property("message");
  });
});
