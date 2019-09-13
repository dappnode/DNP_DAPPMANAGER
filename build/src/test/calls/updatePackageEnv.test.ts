import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import rewiremock from "rewiremock";
// Imports for typings
import updatePackageEnvType from "../../src/calls/updatePackageEnv";
import { createTestDir, cleanTestDir, mockDnp } from "../testUtils";
import { PackageContainer } from "../../src/types";

describe("Call function: updatePackageEnv", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const id = "myPackage.eth";

  const dockerComposePath = getPath.dockerComposeSmart(id);
  const envFilePath = getPath.envFileSmart(id, false);

  async function listContainer(id: string): Promise<PackageContainer> {
    return { ...mockDnp, name: id };
  }

  const restartPackage = sinon.stub().resolves();

  let updatePackageEnv: typeof updatePackageEnvType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/updatePackageEnv"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainer })
          .toBeUsed();
        mock(() => import("../../src/calls/restartPackage"))
          .withDefault(restartPackage)
          .toBeUsed();
      }
    );
    updatePackageEnv = mock.default;
  });

  before(async () => {
    await createTestDir();
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, "docker-compose");
  });

  beforeEach(() => {
    // Prepare mocks
    restartPackage.resetHistory();
  });

  it("Should update the envs and reset the package", async () => {
    // Execute calls
    const res = await updatePackageEnv({
      id,
      envs: { key: "val" },
      restart: true
    });
    // Verify
    // restartPackage should be used to reset the package
    sinon.assert.calledWith(restartPackage, { id });
    // The envs should have been written
    const envString = fs.readFileSync(envFilePath, "utf8");
    expect(envString).to.include("key=val");
    // And return correctly
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("Should NOT reset the package", async () => {
    // Execute calls
    const res = await updatePackageEnv({
      id,
      envs: { key: "val" },
      restart: false
    });
    // Verify
    // restartPackage should NOT be used to reset the package
    sinon.assert.notCalled(restartPackage);
    // And return correctly
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  after(async () => {
    await cleanTestDir();
  });
});
