import "mocha";
import { expect } from "chai";
import { PackageContainer } from "../../src/types";
import { DockerApiSystemDfReturn } from "../../src/modules/docker/dockerApi";
import { mockDnp, mockDockerSystemDfDataSample } from "../testUtils";
import rewiremock from "rewiremock";

import { packagesGet as packagesGetType } from "../../src/calls/packagesGet";

describe("Call function: packagesGet", function() {
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

  let packagesGet: typeof packagesGetType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/packagesGet"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainers })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerApi"))
          .with({ dockerDf })
          .toBeUsed();
      }
    );
    packagesGet = mock.packagesGet;
  });

  it("should list packages with correct arguments", async () => {
    const dnpList = await packagesGet();
    expect(hasListed).to.be.true;
    expect(dnpList).to.deep.equal(expectedResult);
  });
});
