import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "ethClientTargetSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should set ethClientTargetSet to false", async () => {
    url.searchParams.set("fallback", "false");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should set ethClientTargetSet to true", async () => {
    url.searchParams.set("fallback", "true");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
