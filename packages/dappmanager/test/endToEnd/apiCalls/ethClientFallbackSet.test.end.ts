import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "ethClientFallbackSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set fallback to on", async () => {
    url.searchParams.set("fallback", "on");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should set fallback to off", async () => {
    url.searchParams.set("fallback", "off");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
