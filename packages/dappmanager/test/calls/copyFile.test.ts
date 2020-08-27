import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import path from "path";
import { testDir, cleanTestDir, createTestDir, sampleFile } from "../testUtils";
import rewiremock from "rewiremock";
// Imports for typings
import { copyFileFrom as copyFileFromType } from "../../src/calls/copyFileFrom";
import { copyFileTo as copyFileToType } from "../../src/calls/copyFileTo";

describe("Call function: copyFileTo and copyFileFrom", () => {
  /**
   * Tested on a real environment against macOS docker and it works fine
   * For this test to be a unit test, docker is mocked
   */

  const containerSimulatedFolder = `${testDir}/container-volume`;
  const dockerPath = (_path: string): string =>
    containerSimulatedFolder + _path;
  const containerName = "DAppNodePackage-kovan.dnp.dappnode.eth";

  async function dockerCopyFileTo(
    id: string,
    fromPath: string,
    toPath: string
  ): Promise<string> {
    if (id !== containerName)
      throw Error(`Fake docker: Container not found: ${id}`);
    await shell(`mkdir -p ${path.dirname(dockerPath(toPath))}`);
    return await shell(`cp ${fromPath} ${dockerPath(toPath)}`);
  }

  async function dockerCopyFileFrom(
    id: string,
    fromPath: string,
    toPath: string
  ): Promise<string> {
    if (id !== containerName)
      throw Error(`Fake docker: Container not found: ${id}`);
    await shell(`mkdir -p ${path.dirname(dockerPath(fromPath))}`);
    return await shell(`cp ${dockerPath(fromPath)} ${toPath}`);
  }

  async function dockerGetContainerWorkingDir(id: string): Promise<string> {
    id;
    return "/";
  }

  let copyFileTo: typeof copyFileToType;
  let copyFileFrom: typeof copyFileFromType;

  before("Mock", async () => {
    const copyFileToImport = await rewiremock.around(
      () => import("../../src/calls/copyFileTo"),
      mock => {
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerCopyFileTo, dockerGetContainerWorkingDir })
          .toBeUsed();
      }
    );
    const copyFileFromImport = await rewiremock.around(
      () => import("../../src/calls/copyFileFrom"),
      mock => {
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerCopyFileFrom, dockerGetContainerWorkingDir })
          .toBeUsed();
      }
    );
    copyFileTo = copyFileToImport.copyFileTo;
    copyFileFrom = copyFileFromImport.copyFileFrom;
  });

  before(async () => {
    await createTestDir();
  });

  it("should copy a file to a container", async () => {
    await copyFileTo({
      containerName,
      dataUri: sampleFile.dataUri,
      filename: sampleFile.filename,
      toPath: sampleFile.containerPath
    });
  });

  it("should copy a file from a container", async () => {
    const result = await copyFileFrom({
      containerName,
      fromPath: sampleFile.containerPath
    });
    // Check response message
    expect(result).to.be.ok;
    expect(result).to.equal(sampleFile.dataUri);
  });

  after(async () => {
    await cleanTestDir();
  });
});
