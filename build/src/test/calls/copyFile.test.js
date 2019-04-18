const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const params = require("params");
const shell = require("utils/shell");
const path = require("path");

/**
 * Tested on a real environment against macOS docker and it works fine
 * For this test to be a unit test, docker is mocked
 */

const testDir = "test_files";
const modifiedParams = {
  ...params,
  DNCORE_DIR: testDir
};
const containerSimulatedFolder = `${testDir}/container-volume`;
const dockerPath = _path => containerSimulatedFolder + _path;
const id = "kovan.dnp.dappnode.eth";
const containerName = "DAppNodePackage-kovan.dnp.dappnode.eth";

const docker = {
  copyFileFrom: async (id, fromPath, toPath) => {
    if (id !== containerName)
      throw Error(`Fake docker: Container not found: ${id}`);
    await shell(`mkdir -p ${path.dirname(dockerPath(fromPath))}`);
    await shell(`cp ${dockerPath(fromPath)} ${toPath}`);
  },
  copyFileTo: async (id, fromPath, toPath) => {
    if (id !== containerName)
      throw Error(`Fake docker: Container not found: ${id}`);
    await shell(`mkdir -p ${path.dirname(dockerPath(toPath))}`);
    await shell(`cp ${fromPath} ${dockerPath(toPath)}`);
  }
};

const dockerList = {
  listContainers: async () => [
    {
      name: id,
      packageName: containerName
    }
  ]
};

const copyFileTo = proxyquire("calls/copyFileTo", {
  params: modifiedParams,
  "modules/docker": docker,
  "modules/dockerList": dockerList
});
const copyFileFrom = proxyquire("calls/copyFileFrom", {
  params: modifiedParams,
  "modules/docker": docker,
  "modules/dockerList": dockerList
});

const dataUri =
  "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==";
const filename = "config.json";
const containerPath = "/usr/src/config.json";

describe("Call function: copyFileTo and copyFileFrom", () => {
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
