import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { testDir, createTestDir, cleanTestDir } from "../testUtils";
import * as globalEnvsFile from "../../src/utils/globalEnvsFile";
import params from "../../src/params";

describe("Util > globalEnvsFile", function() {
  beforeEach(async () => {
    await cleanTestDir();
    await createTestDir();
  });
  const envPath = path.join(testDir, "global.env");
  const hardRead = (): string => fs.readFileSync(envPath, "utf8");
  const hardWrite = (data: string): void => fs.writeFileSync(envPath, data);

  it("should write and read a global envs file", () => {
    const envs = {
      DAPPNODE_GLOBAL_ENVS_ACTIVE: "true",
      TEST_EMPTY: ""
    };
    globalEnvsFile.writeEnvFile(envPath, envs);
    const retrievedEnvs = globalEnvsFile.readEnvFile(envPath);
    expect(retrievedEnvs).to.deep.equal(envs);
  });

  it("should create the file", () => {
    globalEnvsFile.createFile();
    const envData = fs.readFileSync(globalEnvsFile.envsPath, "utf8");
    expect(envData).to.equal("");
  });

  it("should deal with empty ENVs", () => {
    const envs = { "": "" };
    globalEnvsFile.writeEnvFile(envPath, envs);
    const retrievedEnvs = globalEnvsFile.readEnvFile(envPath);
    expect(hardRead()).to.equal("");
    expect(retrievedEnvs).to.deep.equal({});
  });

  it("should deal with a broken file", () => {
    hardWrite(
      `    
  ==============
      ==
                   THIS_IS

=

  VERY_BROKEN

    `
    );
    const retrievedEnvs = globalEnvsFile.readEnvFile(envPath);
    expect(retrievedEnvs).to.deep.equal({
      THIS_IS: "",
      VERY_BROKEN: ""
    });
  });

  it("Should get the relative path of the env file of a core DNP", () => {
    const id = "vpn.dnp.dappnode.eth";
    fs.writeFileSync(
      path.join(params.DNCORE_DIR, "docker-compose-vpn.yml"),
      "compose"
    );
    expect(globalEnvsFile.getRelativePath(id)).to.equal(
      "dnp.dappnode.global.env"
    );
  });

  it("Should parse paths correctly", () => {
    const globalEnvPathReal =
      "/usr/src/dappnode/DNCORE/dnp.dappnode.global.env";
    const coreComposePath = "/usr/src/dappnode/DNCORE/docker-compose-vpn.yml";
    const dnpComposePath =
      "/usr/src/dappnode/dnp_repo/bitcoin.dnp.dappnode.eth/docker-compose-bitcoin.yml";
    expect(
      globalEnvsFile.getRelativePathFromComposePath(
        coreComposePath,
        globalEnvPathReal
      )
    ).to.equal("dnp.dappnode.global.env", "Wrong core relative path");
    expect(
      globalEnvsFile.getRelativePathFromComposePath(
        dnpComposePath,
        globalEnvPathReal
      )
    ).to.equal(
      "../../DNCORE/dnp.dappnode.global.env",
      "Wrong dnp relative path"
    );
  });

  after(async () => {
    await cleanTestDir();
  });
});
