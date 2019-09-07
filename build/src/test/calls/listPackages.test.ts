import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import { stringifyEnvs } from "../../src/utils/parse";
import { PackageContainer, RpcHandlerReturn } from "../../src/types";
import { DockerApiSystemDfReturn } from "../../src/modules/docker/dockerApi";
import { mockDnp, mockDockerSystemDfDataSample } from "../testUtils";
const proxyquire = require("proxyquire").noCallThru();

interface RpcListPackagesReturn extends RpcHandlerReturn {
  result: PackageContainer[];
}

describe("Call function: listPackages", function() {
  let hasListed = false;
  const envs = { VAR1: "VALUE1" };
  const mockList = [
    {
      ...mockDnp,
      name: "test.dnp.dappnode.eth"
    }
  ];
  // Result should extend the package list with the env variables
  const expectedResult = [Object.assign({ envs }, mockList[0])];

  // Mock docker calls
  const listContainers = async (): Promise<PackageContainer[]> => {
    hasListed = true;
    return mockList;
  };

  async function dockerDf(): Promise<DockerApiSystemDfReturn> {
    return mockDockerSystemDfDataSample;
  }

  // Mock params
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  // initialize call
  const { default: listPackages } = proxyquire("../../src/calls/listPackages", {
    "../modules/docker/listContainers": listContainers,
    "../modules/docker/dockerApi": { dockerDf },
    "../params": params
  });

  before(() => {
    // Write mock data on the test folder
    const ENV_PATH = getPath.envFile(mockList[0].name, params, false);
    validate.path(ENV_PATH);
    fs.writeFileSync(ENV_PATH, stringifyEnvs(envs));
  });

  let res: RpcListPackagesReturn;
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
