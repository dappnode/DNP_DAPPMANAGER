import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { HostStatCpu } from "../../../src/types";

describe("GET /stats/cpu", () => {
  it("Should return the cpu use percentage in string", async () => {
    const response = await fetch(`${dappmanagerTestApiUrl}/stats/cpu`);
    expect(response.status).to.equal(200);
    const body = await response.json();
    // Check the type of body is HostStatCpu
    expect(body).to.be.an.instanceOf(Object);
    expect(body).to.have.property("usedPercentage");
    expect(body.usedPercentage).to.be.a("number");
  });
});
