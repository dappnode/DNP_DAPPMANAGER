import "mocha";
import { expect } from "chai";
import { getHostUptime } from "../../../src/calls/getHostUptime.js";

describe.only("Call function: getHostUptime", function() {
    it("Should return the uptime of the host", async () => {
        const output = await getHostUptime();
        console.log(output);
    });
});