import { expect } from "chai";
import { getPublicIpFromUrls } from "../../src/getPublicIpFromUrls.js";
import { isIP } from "is-ip";

describe("getPublicIpFromUrls", () => {
  it("should return the public IP of the Dappnode", async () => {
    const publicIp = await getPublicIpFromUrls();
    // Result should be an IP
    expect(isIP(publicIp)).to.be.true;
  });
});
