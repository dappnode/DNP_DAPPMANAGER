import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import fs from "fs";

const hostScriptsPath = process.cwd() + "/hostScripts";

describe("Host scripts", () => {
  it("Should fetch docker engine update requirements", async () => {
    const dockerEngineUpdateRequirements = await shell(
      `sudo bash ${hostScriptsPath}/docker_engine_update.sh --print-host-info`
    );
    const dockerEngine = fs.readFileSync(
      "/usr/src/dappnode/logs/docker_engine_update.log",
      "utf8"
    );
    console.log(dockerEngine);
    expect(dockerEngineUpdateRequirements).to.be.ok;
  });

  it("Should fetch docker compose update requirements", async () => {
    const dockerComposeUpdateRequirements = await shell(
      `sudo bash ${hostScriptsPath}/docker_compose_update.sh --version`
    );
    const dockerComposeLog = fs.readFileSync(
      "/usr/src/dappnode/logs/docker_compose_update.log",
      "utf8"
    );
    console.log(dockerComposeLog);
    expect(dockerComposeUpdateRequirements).to.be.ok;
  });

  it("Should fetch host info", async () => {
    const hostInfo = await shell(
      `sudo bash ${hostScriptsPath}/collect_host_info.sh`
    );
    expect(hostInfo).to.be.ok;
  });
});
