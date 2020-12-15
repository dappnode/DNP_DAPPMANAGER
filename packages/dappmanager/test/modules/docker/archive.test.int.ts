import { expect } from "chai";
import { docker } from "../../../src/modules/docker/api/docker";
import { dockerGetArchiveSingleFile } from "../../../src/modules/docker/api/getArchive";
import { dockerPutArchiveSingleFile } from "../../../src/modules/docker/api/putArchive";

describe("docker / archive put, get", function() {
  const containerName = "DAppNodeTest-file-transfer";
  const filePath = "/a/b/c/sample.json";
  const fileContent = JSON.stringify(
    { sampleConfig: true, someValue: 22 },
    null,
    2
  );

  async function removeContainer(): Promise<void> {
    const container = docker.getContainer(containerName);
    await container.remove({ force: true });
  }

  before("Remove previous container", async function() {
    await removeContainer().catch(() => {
      //
    });
  });

  // after("Remove test container", async () => {
  //   await removeContainer();
  // });

  before("Start test container", async function() {
    this.timeout(60 * 1000);

    const container = await docker.createContainer({
      Image: "nginx:alpine",
      AttachStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      OpenStdin: false,
      StdinOnce: false,
      name: "DAppNodeTest-file-transfer"
    });

    await container.start();
  });

  it("Should put and get a file", async () => {
    await dockerPutArchiveSingleFile(
      containerName,
      filePath,
      Buffer.from(fileContent)
    );

    const returnedFileBuffer = await dockerGetArchiveSingleFile(
      containerName,
      filePath
    );
    const returnedFileContent = returnedFileBuffer.toString("utf8");
    expect(returnedFileContent).to.equal(
      fileContent,
      "returned file does not match put file"
    );
  });
});
