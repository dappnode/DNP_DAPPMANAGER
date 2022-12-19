import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
import fetch from "node-fetch";
import { URL } from "url";

const apiCallMethod = "autoUpdateSettingsEdit";

describe(`API call ${apiCallMethod}`, async () => {
  it("Should return the auto-updates settings", async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);
    const data: { id: string; enabled: boolean } = {
      id: "my-packages",
      enabled: true
    };
    url.searchParams.append("id", data.id);
    url.searchParams.append("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    expect(validateRoutesReturn(apiCallMethod, body)).to.be.ok;
  });
});
