const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

chai.should();

describe("Call function: restartPackage", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const PACKAGE_NAME = "test.dnp.dappnode.eth";
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);

  before(() => {
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, "docker-compose");
  });

  it("should restart the package", async () => {
    // Mock docker
    const docker = {
      safe: {
        compose: {
          up: sinon.fake()
        }
      },
      compose: {
        rm: sinon.fake()
      }
    };
    // Mock parse
    const restartPackage = proxyquire("calls/restartPackage", {
      "modules/docker": docker,
      params: params
    });
    let res = await restartPackage({ id: PACKAGE_NAME });
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.compose.rm, DOCKERCOMPOSE_PATH);
    sinon.assert.calledWith(docker.safe.compose.up, DOCKERCOMPOSE_PATH);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
  });
});
