import "mocha";
import { expect } from "chai";
import { getHostUptime } from "../../../src/calls/getHostUptime.js";

describe.skip("Call function: getHostUptime", function () {
  it("Should return the uptime of the host", async () => {
    const output = await getHostUptime();
    const uptimePattern =
      /^up (\d+ weeks?, )?(\d+ days?, )?(\d+ hours?, )?(\d+ minutes?)?$/;
    const matches = uptimePattern.test(output);
    expect(matches).to.be.true;
    console.log(output);
  });
});
