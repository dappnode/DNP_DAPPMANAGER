import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
const apiCallMethod = "packageGet";

describe.skip(`API call ${apiCallMethod}`, async () => {
  it("Should return the cpu use percentage", async () => {
    const response = await fetch(`${dappmanagerTestApiUrl}/$apiCallMethod`);
    expect(response.status).to.equal(200);
    const body = await response.json();
    expect(validateRoutesReturn(apiCallMethod, body)).to.be.ok;
  });
});
