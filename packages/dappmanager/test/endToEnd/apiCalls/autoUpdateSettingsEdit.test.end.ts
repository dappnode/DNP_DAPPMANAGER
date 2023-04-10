import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import fetch from "node-fetch";
import { URL } from "url";

const apiCallMethod = "autoUpdateSettingsEdit";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should edit the auto-updates settings for my-packages to false", async () => {
    const data: { id: string; enabled: boolean } = {
      id: "my-packages",
      enabled: false
    };
    url.searchParams.set("id", data.id);
    url.searchParams.set("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should edit the auto-updates settings for system-packages to false", async () => {
    const data: { id: string; enabled: boolean } = {
      id: "system-packages",
      enabled: false
    };
    url.searchParams.set("id", data.id);
    url.searchParams.set("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should edit the auto-updates settings for my-packages to true", async () => {
    const data: { id: string; enabled: boolean } = {
      id: "my-packages",
      enabled: true
    };
    url.searchParams.set("id", data.id);
    url.searchParams.set("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should edit the auto-updates settings for an individual package to false", async () => {
    const data: { id: string; enabled: boolean } = {
      id: "geth.dnp.dappnode.eth",
      enabled: false
    };
    url.searchParams.set("id", data.id);
    url.searchParams.set("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });

  it("Should edit the auto-updates settings for an individual package to true", async () => {
    const data: { id: string; enabled: boolean } = {
      id: "geth.dnp.dappnode.eth",
      enabled: true
    };
    url.searchParams.set("id", data.id);
    url.searchParams.set("enabled", data.enabled.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
