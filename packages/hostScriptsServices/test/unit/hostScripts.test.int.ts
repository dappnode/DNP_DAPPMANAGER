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
    const hostInfo = await shellHost(`sudo bash ${hostScriptsPath}/sensors.sh`);
    const temp = parseFloat(hostInfo);
    console.log(temp);
    expect(temp).to.be.a('number');
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
