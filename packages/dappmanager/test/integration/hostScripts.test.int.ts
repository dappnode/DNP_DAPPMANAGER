import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import path from "path";

const hostScriptsPath = process.cwd() + "/hostScripts";

describe.only("Host scripts", () => {
  it("Should fetch docker engine update requirements", async () => {
    await shell(`chmod +x ${hostScriptsPath}/docker_engine_update.sh`);
    const dockerEngineUpdateRequirements = await shell(
      `${hostScriptsPath}/docker_engine_update.sh --print-host-info`
    );
    console.log(dockerEngineUpdateRequirements);
    expect(dockerEngineUpdateRequirements).to.be.ok;
  });

  it("Should fetch docker compose update requirements", async () => {
    await shell(`chmod +x ${hostScriptsPath}/docker_compose_update.sh`);
    const dockerComposeUpdateRequirements = await shell(
      `${hostScriptsPath}/docker_compose_update.sh --version`
    );
    console.log(dockerComposeUpdateRequirements);
    expect(dockerComposeUpdateRequirements).to.be.ok;
  });

  it("Should fetch host info", async () => {
    await shell(`chmod +x ${hostScriptsPath}/collect_host_info.sh`);
    const hostInfo = await shell(`${hostScriptsPath}/collect_host_info.sh`);
    console.log(hostInfo);
    expect(hostInfo).to.be.ok;
  });
});
