import "mocha";
import { expect } from "chai";
import shell from "../../src/utils/shell";
import path from "path";
import { PackageContainer } from "../../src/types";
import { mockDnp, testDir } from "../testUtils";
import rewiremock from "rewiremock";
// Imports for typings
import copyFileFromType from "../../src/calls/copyFileFrom";
import copyFileToType from "../../src/calls/copyFileTo";

describe("Call function: copyFileTo and copyFileFrom", () => {
  /**
   * Tested on a real environment against macOS docker and it works fine
   * For this test to be a unit test, docker is mocked
   */

  const containerSimulatedFolder = `${testDir}/container-volume`;
  const dockerPath = (_path: string): string =>
    containerSimulatedFolder + _path;
  const id = "kovan.dnp.dappnode.eth";
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

  async function listContainer(): Promise<PackageContainer> {
    return { ...mockDnp, name: id, packageName: containerName };
  }

  let copyFileTo: typeof copyFileToType;
  let copyFileFrom: typeof copyFileFromType;

  before("Mock", async () => {
    const copyFileToImport = await rewiremock.around(
      () => import("../../src/calls/copyFileTo"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainer })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerCopyFileTo, dockerGetContainerWorkingDir })
          .toBeUsed();
      }
    );
    const copyFileFromImport = await rewiremock.around(
      () => import("../../src/calls/copyFileFrom"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainer })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerCopyFileFrom, dockerGetContainerWorkingDir })
          .toBeUsed();
      }
    );
    copyFileTo = copyFileToImport.default;
    copyFileFrom = copyFileFromImport.default;
  });

  const dataUri =
    "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==";
  const filename = "config.json";
  const containerPath = "/usr/src/config.json";

  before(async () => {
    await shell(`mkdir -p ${testDir}`);
  });

  it("should copy a file to a container", async () => {
    const res = await copyFileTo({
      id,
      dataUri,
      filename,
      toPath: containerPath
    });
    // Check response message
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should copy a file from a container", async () => {
    const res = await copyFileFrom({ id, fromPath: containerPath });
    // Check response message
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res).to.have.property("result");
    expect(res.result).to.equal(dataUri);
  });

  after(async () => {
    await shell(`rm -rf ${testDir}`);
  });
});
