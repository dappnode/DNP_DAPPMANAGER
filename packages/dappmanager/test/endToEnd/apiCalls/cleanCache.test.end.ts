import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "cleanCache";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should clean the cache db", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
