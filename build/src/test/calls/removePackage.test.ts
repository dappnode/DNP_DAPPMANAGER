import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import rewiremock from "rewiremock";
// Imports for typings
import removePackageType from "../../src/calls/removePackage";
import { PackageContainer } from "../../src/types";
import { mockDnp, cleanTestDir } from "../testUtils";

describe("Call function: removePackage", function() {
  const id = "test.dnp.dappnode.eth";
  const dockerComposePath = getPath.dockerCompose(id, false);
  const dockerComposeTemplate = `
  version: '3.4'
      services:
          ${id}:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER
  `.trim();

  const dnp: PackageContainer = {
    ...mockDnp,
    isCore: false,
    packageName: `DAppNodePackage-${id}`,
    name: id
  };

  const dockerComposeDown = sinon.stub().resolves();
  const dockerRm = sinon.stub().resolves();
  const listContainer = sinon.stub().resolves(dnp);

  const eventBus = {
    requestPackages: { emit: sinon.stub(), on: sinon.stub() },
    packagesModified: { emit: sinon.stub(), on: sinon.stub() }
  };

  let removePackage: typeof removePackageType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/removePackage"),
      mock => {
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerComposeDown, dockerRm })
          .toBeUsed();
        mock(() => import("../../src/eventBus"))
          .with(eventBus)
          .toBeUsed();
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainer })
          .toBeUsed();
      }
    );
    removePackage = mock.default;
  });

  before(async () => {
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    await removePackage({ id });
  });

  it("should have called docker-compose down", async () => {
    sinon.assert.callCount(dockerComposeDown, 1);
    expect(dockerComposeDown.firstCall.args).to.deep.equal(
      [dockerComposePath, { volumes: false, timeout: 10 }],
      `should call docker.compose.down for the package ${id}`
    );
  });

  it("should request to emit packages to refresh the UI", async () => {
    sinon.assert.calledOnce(eventBus.requestPackages.emit);
    sinon.assert.calledOnce(eventBus.packagesModified.emit);
    expect(eventBus.packagesModified.emit.firstCall.lastArg).to.deep.equal({
      ids: [id],
      removed: true
    });
  });

  after(async () => {
    await cleanTestDir();
  });
});
