import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import { PackageContainer } from "../../src/types";
import { DockerApiSystemDfReturn } from "../../src/modules/docker/dockerApi";
import { mockDnp, mockDockerSystemDfDataSample } from "../testUtils";
import rewiremock from "rewiremock";
// Imports for typings
import { listPackages as listPackagesType } from "../../src/calls/listPackages";
import { stringifyEnvironment } from "../../src/utils/dockerComposeParsers";

describe("Call function: listPackages", function() {
  let hasListed = false;
  const envs = { VAR1: "VALUE1" };
  const dnp = { ...mockDnp, name: "test.dnp.dappnode.eth" };
  const mockList = [dnp];
  // Result should extend the package list with the env variables
  const expectedResult: PackageContainer[] = [Object.assign({ envs }, dnp)];

  // Mock docker calls
  const listContainers = async (): Promise<PackageContainer[]> => {
    hasListed = true;
    return mockList;
  };

  async function dockerDf(): Promise<DockerApiSystemDfReturn> {
    return mockDockerSystemDfDataSample;
  }

  let listPackages: typeof listPackagesType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/listPackages"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainers })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerApi"))
          .with({ dockerDf })
          .toBeUsed();
      }
    );
    listPackages = mock.listPackages;
  });

  before(() => {
    // Write mock data on the test folder
    const ENV_PATH = getPath.envFile(mockList[0].name, false);
    validate.path(ENV_PATH);
    fs.writeFileSync(ENV_PATH, stringifyEnvironment(envs).join("\n"));
  });

  it("should list packages with correct arguments", async () => {
    const dnpList = await listPackages();
    expect(hasListed).to.be.true;
    expect(dnpList).to.deep.equal(expectedResult);
  });
});
