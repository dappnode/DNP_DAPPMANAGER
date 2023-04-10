import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

const apiCallMethod = "getUserActionLogs";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should returns the user action logs. This logs are stored in a different file and format, and are meant to ease user support", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    printData(body[0]);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
