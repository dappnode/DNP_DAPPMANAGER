import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "dappnodeWebNameSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set the dappnodeWebNameSet", async () => {
    url.searchParams.set("dappnodeWebName", "test");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
