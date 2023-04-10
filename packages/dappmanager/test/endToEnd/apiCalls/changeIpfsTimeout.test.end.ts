import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "changeIpfsTimeout";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set a new value for IPFS timeout", async () => {
    url.searchParams.set("timeout", (0.5 * 60 * 1000).toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
