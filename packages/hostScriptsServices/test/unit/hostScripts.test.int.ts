import "mocha";
import { expect } from "chai";
import { shell } from "@dappnode/utils";

const hostScriptsPath = process.cwd() + "/hostScripts";

describe("Host scripts", () => {
  it("Should fetch host sensors data", async () => {
    const hostInfo = await shell(`sudo bash ${hostScriptsPath}/sensors.sh`);
    console.log(hostInfo);
    expect(hostInfo).to.be.ok;
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
