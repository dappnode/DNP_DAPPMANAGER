import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "ethClientFallbackSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set fallback to true", async () => {
    url.searchParams.set("fallback", "true");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should set fallback to false", async () => {
    url.searchParams.set("fallback", "false");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
