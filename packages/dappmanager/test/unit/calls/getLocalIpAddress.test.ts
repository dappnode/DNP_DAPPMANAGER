import "mocha";
import { expect } from "chai";
import { getLocalIpAddress } from "../../../src/calls/getLocalIpAddress.js";

describe.only("Call function: getLocalIpAddress", function () {
  it("Should return the ip address of the host", async () => {
    const address = await getLocalIpAddress();
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    expect(address).to.be.ok;
    expect(address).to.match(ipv4Pattern);
    console.log(address);
  });
});