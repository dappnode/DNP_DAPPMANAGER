const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const params = require("params");
const shell = require("utils/shell");
const path = require("path");
const { promisify } = require("util");
const fs = require("fs");

const writeFileAsync = promisify(fs.writeFile);

const testDir = params.DNCORE_DIR;

/**
 * Tested on a real environment against macOS docker and it works fine
 * For this test to be a unit test, docker is mocked
 */

const containerSimulatedFolder = `${testDir}/container-volume`;
const dockerPath = _path => path.join(containerSimulatedFolder, _path);
const id = "kovan.dnp.dappnode.eth";

const docker = {
  copyFileFrom: async (_id, { pathContainer, pathHost }) => {
    if (_id !== id) throw Error(`Fake docker: Container not found: ${_id}`);
    const pathContainerReal = dockerPath(pathContainer);
    if (!fs.existsSync(pathContainerReal))
      throw Error(`Fake docker: container path ${pathContainerReal} not found`);
    const filePath = pathContainerReal;
    const filePathTar = filePath + ".tar";
    // Use tar with the relative path option
    const { dir, base } = path.parse(filePath);
    await shell(`tar cvf ${filePathTar} -C ${dir} ${base}`);
    await shell(`mv ${filePathTar} ${pathHost}`);
  },
  copyFileTo: async (_id, { pathContainer, content, filename }) => {
    if (_id !== id) throw Error(`Fake docker: Container not found: ${_id}`);
    await shell(`mkdir -p ${dockerPath(pathContainer)}`);
    // Content is a buffer, convert to utf8 for writeFile
    const filePath = path.join(dockerPath(pathContainer), filename);
    const contentString = content.toString("utf8");
    if (!contentString) throw Error(`Empty content string for ${content}`);
    await writeFileAsync(filePath, contentString);
    if (!fs.existsSync(filePath))
      throw Error(`Error copying contents to ${filePath}, file does not exist`);
  }
};

const copyFileTo = proxyquire("calls/copyFileTo", {
  "modules/docker": docker
});
const copyFileFrom = proxyquire("calls/copyFileFrom", {
  "modules/docker": docker
});

const dataUri =
  "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==";
const filename = "config.json";
const containerPath = "/usr/src";

describe("Call function: copyFileTo and copyFileFrom", () => {
  before(async () => {
    await shell(`rm -rf ${testDir}`);
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
    const res = await copyFileFrom({
      id,
      fromPath: path.join(containerPath, filename)
    });
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
