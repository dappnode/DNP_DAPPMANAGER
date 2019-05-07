const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");
const docker = require("modules/docker");

chai.should();

describe("Call function: togglePackage", function() {
  describe("mock test", mockTest);
});

const dockerComposeTemplate = `
version: '3.4'
services:
    otpweb.dnp.dappnode.eth:
        image: 'chentex/random-logger:latest'
        container_name: DNP_DAPPMANAGER_TEST_CONTAINER
`.trim();

function mockTest() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)

  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const PACKAGE_NAME = "test.dnp.dappnode.eth";
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  sinon.restore();
  sinon.replace(docker, "status", sinon.fake.resolves("running"));
  sinon.replace(docker.compose, "stop", sinon.fake.resolves());
  const togglePackage = proxyquire("calls/togglePackage", {
    "modules/docker": docker,
    params: params
  });

  before(() => {
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    let res = await togglePackage({ id: PACKAGE_NAME });
    sinon.assert.called(docker.status);
    sinon.assert.called(docker.compose.stop);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should throw an error with wrong package name", async () => {
    let error = "--- togglePackage did not throw ---";
    try {
      await togglePackage({ id: "anotherPackage.dnp.eth" });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("docker-compose does not exist");
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
  });
}
