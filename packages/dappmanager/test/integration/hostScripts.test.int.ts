import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import fs from "fs";

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

  it("Should execute security updates", async () => {
    try {
      const securityUpdate = await shell(
        `sudo bash ${hostScriptsPath}/security_update.sh`
      );
      console.log(securityUpdate);
      expect(securityUpdate).to.be.ok;
    } catch (e) {
      try {
        const usrFileStructure = fs.readdirSync("/usr/src");
        console.log("usrFileStructure: ", usrFileStructure);
        const securityLog = fs.readFileSync(
          "/usr/src/dappnode/logs/security_update.log",
          "utf8"
        );
        console.log(securityLog);
      } catch (e) {
        console.log("Error reading secuiryt log: ", e);
      }
      throw e;
    }
  });

  /*   after("Clean logs", async function() {
    await shell(`sudo rm -rf /usr/src/dappnode/logs`);
  }); */
});
