import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "@dappnode/common";
import fetch from "node-fetch";
import { URL } from "url";

const apiCallMethod = "statsCpuGet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should return the cpu use percentage", async () => {
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    console.log(body);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
