import "mocha";
import { expect } from "chai";
import fs from "fs";
import { createTestDir, cleanTestDir } from "../../testUtils.js";
import {
  createGlobalEnvsEnvFile,
  globalEnvsFilePath,
  computeGlobalEnvsFromDb,
  writeGlobalEnvsToEnvFile
} from "../../../src/modules/globalEnvs.js";

describe("Module > globalEnvs", function () {
  beforeEach(async () => {
    await cleanTestDir();
    await createTestDir();
  });

  it("Should compute global ENVs from an empty DB", () => {
    const globalEnvs = computeGlobalEnvsFromDb(false);
    expect(globalEnvs).to.deep.include({ ACTIVE: "true", INTERNAL_IP: "" });
  });

  it("should create the file", () => {
    createGlobalEnvsEnvFile();
    const envData = fs.readFileSync(globalEnvsFilePath, "utf8");
    expect(envData).to.include("_DAPPNODE_GLOBAL_ENVS_ACTIVE=true");
  });

  it("should write a global envs file", () => {
    writeGlobalEnvsToEnvFile();
    const envData = fs.readFileSync(globalEnvsFilePath, "utf8");
    expect(envData).to.include("_DAPPNODE_GLOBAL_ENVS_ACTIVE=true");
    expect(envData).to.include("_DAPPNODE_GLOBAL_INTERNAL_IP");
  });

  after(async () => {
    await cleanTestDir();
  });
});
