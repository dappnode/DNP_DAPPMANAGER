import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "ipfsTest";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Attempts to cat a common IPFS hash. resolves if all OK, throws otherwise", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
