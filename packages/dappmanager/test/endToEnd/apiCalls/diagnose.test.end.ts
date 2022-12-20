import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

const apiCallMethod = "diagnose";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should returns a list of checks done as a diagnose", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    printData(body);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
