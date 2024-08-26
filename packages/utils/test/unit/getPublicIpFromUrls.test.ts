import { expect } from "chai";
import { getPublicIpFromUrls } from "../../src/getPublicIpFromUrls.js";
import isIp from "is-ip";

describe("getPublicIpFromUrls", () => {
  it("should return the public IP of the Dappnode", async () => {
    const publicIp = await getPublicIpFromUrls();
    // Result should be an IP
    expect(isIp(publicIp)).to.be.true;
  });
});
