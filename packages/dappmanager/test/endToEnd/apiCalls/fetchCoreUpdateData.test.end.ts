import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

const apiCallMethod = "fetchCoreUpdateData";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should fetch the core update data, if available", async () => {
    url.searchParams.set("version", "0.2.64");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    printData(body);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
