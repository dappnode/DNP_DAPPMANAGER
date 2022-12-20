import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "cleanDb";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe.skip(`API call ${apiCallMethod}`, async () => {
  it("Should clean the maindb", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
