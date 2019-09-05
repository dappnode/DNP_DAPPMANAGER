import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import { stringifyEnvs } from "../../src/utils/parse";

const proxyquire = require("proxyquire").noCallThru();

describe("Call function: listPackages", function() {
  let hasListed = false;
  const envs = { VAR1: "VALUE1" };
  const mockList = [
    {
      name: "test.dnp.dappnode.eth"
    }
  ];
  // Result should extend the package list with the env variables
  const expectedResult = [Object.assign({ envs }, mockList[0])];

  // Mock docker calls
  const listContainers = async () => {
    hasListed = true;
    return mockList;
  };

  const docker = {
    systemDf: async () => {
      return [];
    }
  };

  // Mock params
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  // initialize call
  const { default: listPackages } = proxyquire("../../src/calls/listPackages", {
    "../modules/listContainers": listContainers,
    "../modules/docker": docker,
    "../params": params
  });

  before(() => {
    // Write mock data on the test folder
    const ENV_PATH = getPath.envFile(mockList[0].name, params, false);
    validate.path(ENV_PATH);
    fs.writeFileSync(ENV_PATH, stringifyEnvs(envs));
  });

  let res: any;
  it("should list packages with correct arguments", async () => {
    res = await listPackages();
    expect(hasListed).to.be.true;
  });

  it("should return a stringified object containing lists", () => {
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res).to.deep.include({
      result: expectedResult
    });
  });
});
