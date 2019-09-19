import "mocha";
import { expect } from "chai";
import path from "path";
import { testDir, createTestDir, cleanTestDir } from "../testUtils";

import * as globalEnvsFile from "../../src/utils/globalEnvsFile";

describe("Util > globalEnvsFile", function() {
  before(async () => {
    await createTestDir();
  });

  it("should write and read a global envs file", () => {
    const envPath = path.join(testDir, "global.env");
    const envs = {
      DAPPNODE_GLOBAL_ENVS_ACTIVE: "true",
      TEST_EMPTY: ""
    };
    globalEnvsFile.writeEnvFile(envPath, envs);
    const retrievedEnvs = globalEnvsFile.readEnvFile(envPath);
    expect(retrievedEnvs).to.deep.equal(envs);
  });

  after(async () => {
    await cleanTestDir();
  });
});
