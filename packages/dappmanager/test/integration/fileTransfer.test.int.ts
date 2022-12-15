import { expect } from "chai";
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { docker } from "../../src/modules/docker/api/docker";
import { dockerGetArchiveSingleFile } from "../../src/modules/docker/api/getArchive";
import { dockerPutArchiveSingleFile } from "../../src/modules/docker/api/putArchive";
import { fileDownload } from "../../src/api/routes/fileDownload";
import { URL } from "url";
import { MemoryWritable } from "./testStreamUtils";

describe("file transfer - docker archive put, get", function () {
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

  before("Remove previous container", async function () {
    await removeContainer().catch(() => {
      //
    });
  });

  after("Remove test container", async () => {
    await removeContainer();
  });

  before("Start test container", async function () {
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

  describe("through docker", () => {
    it("Should put and get a file", async () => {
      await dockerPutArchiveSingleFile(
        containerName,
        filePath,
        Buffer.from(fileContent)
      );

      const fileContentSink = new MemoryWritable<Buffer>();

      await dockerGetArchiveSingleFile(
        containerName,
        filePath,
        fileContentSink
      );

      const returnedFileBuffer = Buffer.concat(fileContentSink.chunks);
      const returnedFileContent = returnedFileBuffer.toString("utf8");
      expect(returnedFileContent).to.equal(
        fileContent,
        "returned file does not match put file"
      );
    });
  });

  describe("through API", () => {
    const afterCallbacks: (() => void)[] = [];
    afterEach(() => {
      while (afterCallbacks.length > 0) {
        const callback = afterCallbacks.pop();
        if (callback) callback();
      }
    });

    beforeEach("Add file to container", async () => {
      await dockerPutArchiveSingleFile(
        containerName,
        filePath,
        Buffer.from(fileContent)
      );
    });

    it("Sould put and get a file from the API directly", async () => {
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.text());
      app.use(bodyParser.urlencoded({ extended: true }));

      const port = 8965;
      app.get<{ containerName: string }>(
        "/file-download/:containerName",
        fileDownload
      );

      const server = new http.Server(app);

      await new Promise<void>(resolve => {
        server.listen(port, () => {
          resolve();
        });
      });

      afterCallbacks.push(() => server.close());

      // ==========
      // Do request
      // ==========

      const url = new URL("http://localhost");
      url.port = String(port);
      url.pathname = `file-download/${containerName}`;
      url.searchParams.set("path", filePath);

      const res = await fetch(url.toString());
      const resText = await res.text();
      if (!res.ok) {
        throw Error(`${res.statusText}\n${resText}`);
      }

      expect(resText).to.equal(
        fileContent,
        "returned file does not match put file"
      );
    });
  });
});
