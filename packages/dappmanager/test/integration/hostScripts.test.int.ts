import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";

const hostScriptsPath = process.cwd() + "/hostScripts";

describe("Host scripts", () => {
  it("Should fetch docker engine update requirements", async () => {
    const dockerEngineUpdateRequirements = await shell(
      `bash ${hostScriptsPath}/docker_engine_update.sh --print-host-info`
    );
    expect(dockerEngineUpdateRequirements).to.be.ok;
  });

  it("Should fetch docker compose update requirements", async () => {
    const dockerComposeUpdateRequirements = await shell(
      `bash ${hostScriptsPath}/docker_compose_update.sh --version`
    );
    expect(dockerComposeUpdateRequirements).to.be.ok;
  });

  it("Should fetch host info", async () => {
    const hostInfo = await shell(
      `bash ${hostScriptsPath}/collect_host_info.sh`
    );
    expect(hostInfo).to.be.ok;
  });
});
