import { expect } from "chai";
import { subnetsOverlap } from "../../src/ensureDockerNetworkConfigs/createDockerNetwork.js";

describe("Subnet Overlap Tests", () => {
  it("should detect overlapping subnets", () => {
    expect(subnetsOverlap("192.168.1.0/24", "192.168.1.128/25")).to.be.true;
    expect(subnetsOverlap("10.0.0.0/8", "10.1.2.3/16")).to.be.true;
    expect(subnetsOverlap("10.1.2.3/16", "10.0.0.0/8")).to.be.true;
    expect(subnetsOverlap("172.33.0.0/16", "172.33.0.0/16")).to.be.true;
  });

  it("should detect non-overlapping subnets", () => {
    expect(subnetsOverlap("192.168.1.0/24", "192.168.2.0/24")).to.be.false;
    expect(subnetsOverlap("172.16.0.0/16", "172.17.0.0/16")).to.be.false;
    expect(subnetsOverlap("10.20.0.0/24", "172.33.0.0/16")).to.be.false;
  });

  it("should throw an error for invalid inputs", () => {
    expect(() => subnetsOverlap("192.168.1.300/24", "192.168.2.0/24")).to.throw();
    expect(() => subnetsOverlap("192.168.1.0/24", "invalid")).to.throw();
    expect(() => subnetsOverlap("172.33.0.0/40", "172.33.0.0/16")).to.throw();
  });
});
