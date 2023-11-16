import "mocha";
import { expect } from "chai";
import { getHostUptime } from "../../../src/calls/getHostUptime.js";

describe.only("Call function: getHostUptime", function () {
  it("should return the uptime of the host", async () => {
    console.log("me llamo pablo");
    const output = await getHostUptime();
    console.log(output);
  });
});
