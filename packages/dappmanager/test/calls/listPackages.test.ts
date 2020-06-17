import "mocha";
import { expect } from "chai";
import { PackageContainer } from "../../src/types";
import { DockerApiSystemDfReturn } from "../../src/modules/docker/dockerApi";
import { mockDnp, mockDockerSystemDfDataSample } from "../testUtils";
import rewiremock from "rewiremock";

import { listPackages as listPackagesType } from "../../src/calls/listPackages";

describe("Call function: listPackages", function() {
  let hasListed = false;
  const dnp = { ...mockDnp, name: "test.dnp.dappnode.eth" };
  const mockList = [dnp];
  const expectedResult: PackageContainer[] = [dnp];

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

  it("should list packages with correct arguments", async () => {
    const dnpList = await listPackages();
    expect(hasListed).to.be.true;
    expect(dnpList).to.deep.equal(expectedResult);
  });
});
