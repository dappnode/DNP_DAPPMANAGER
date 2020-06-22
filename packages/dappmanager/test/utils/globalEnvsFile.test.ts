import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { testDir, createTestDir, cleanTestDir } from "../testUtils";
import * as globalEnvsFile from "../../src/utils/globalEnvsFile";

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

  after(async () => {
    await cleanTestDir();
  });
});
