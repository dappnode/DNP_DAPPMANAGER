import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../../src/utils/getPath";
import * as validate from "../../../src/utils/validate";
import rewiremock from "rewiremock/webpack";
// Imports for typings
import { packageRemove as packageRemoveType } from "../../../src/calls/packageRemove";
import { InstalledPackageData } from "@dappnode/common";
import { mockDnp, cleanTestDir, mockContainer } from "../../testUtils";
import { getMockEventBus } from "./eventBus";

describe.skip("Call function: packageRemove", function () {
  const dnpName = "test.dnp.dappnode.eth";
  const dockerComposePath = getPath.dockerCompose(dnpName, false);
  const dockerComposeTemplate = `
  version: '3.5'
      services:
          ${dnpName}:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER
  `.trim();

  const dnp: InstalledPackageData = {
    ...mockDnp,
    isCore: false,
    dnpName: dnpName,
    containers: [
      {
        ...mockContainer,
        containerName: `DAppNodePackage-${dnpName}`
      }
    ]
  };

  const dockerComposeDown = sinon.stub().resolves();
  const dockerContainerRemove = sinon.stub().resolves();
  const listPackage = sinon.stub().resolves(dnp);

  const eventBus = getMockEventBus();

  let packageRemove: typeof packageRemoveType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../src/calls/packageRemove"),
      mock => {
        mock(() => import("../../../src/modules/docker/compose"))
          .with({ dockerComposeDown })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker"))
          .with({ dockerContainerRemove })
          .toBeUsed();
        mock(() => import("../../../src/eventBus"))
          .with({ eventBus })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listPackage })
          .toBeUsed();
      }
    );
    packageRemove = mock.packageRemove;
  });

  before(async () => {
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    await packageRemove({ dnpName });
  });

  it("should have called docker-compose down", async () => {
    sinon.assert.callCount(dockerComposeDown, 1);
    expect(dockerComposeDown.firstCall.args[0]).to.deep.equal(
      dockerComposePath,
      `should call docker.compose.down for the package ${dnpName}`
    );
  });

  it("should request to emit packages to refresh the UI", async () => {
    sinon.assert.calledOnce(eventBus.requestPackages.emit);
    sinon.assert.calledOnce(eventBus.packagesModified.emit);
    expect(eventBus.packagesModified.emit.firstCall.lastArg).to.deep.equal({
      dnpNames: [dnpName],
      removed: true
    });
  });

  after(async () => {
    await cleanTestDir();
  });
});
