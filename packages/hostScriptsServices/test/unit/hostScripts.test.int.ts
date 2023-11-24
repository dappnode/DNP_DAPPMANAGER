import "mocha";
import { expect } from "chai";
import { shell, shellHost } from "@dappnode/utils";
import { syncBuiltinESMExports } from "module";

const hostScriptsPath = process.cwd() + "/hostScripts";

describe("Host scripts", () => {
  it("Should fetch host info", async () => {
    const hostInfo = await shell(
      `sudo bash ${hostScriptsPath}/collect_host_info.sh`
    );
    expect(hostInfo).to.be.ok;
  });
});

describe("Sensor scripts", () => {
  it("Should fetch host sensors data", async () => {
    const hostInfo = await shellHost(
      `sudo bash ${hostScriptsPath}/getCpuTemperature.sh`
    );
    const temp = parseFloat(hostInfo);

    //If temp is NaN, skip the test
    if (!isNaN(temp)) {
      expect(temp).to.be.a("number");
      expect(temp).to.be.at.least(0);
      expect(temp).to.be.below(200);
    }
  });

  // host_update.sh script not able to tested on github action
  // works locally
  /*   it("Should execute host updates", async () => {
    const hostUpdate = await shell(
      `sudo bash ${hostScriptsPath}/host_update.sh`
    );
    expect(hostUpdate).to.be.ok;
  });
 */
  after("Clean logs", async function() {
    await shell(`sudo rm -rf /usr/src/dappnode/logs`);
  });
});
