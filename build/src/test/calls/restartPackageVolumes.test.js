const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

chai.should();

describe("Call function: restartPackageVolumes", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const PACKAGE_NAME = "test.dnp.dappnode.eth";
  const CORE_PACKAGE_NAME = "testCore.dnp.dappnode.eth";
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  const CORE_DOCKERCOMPOSE_PATH = getPath.dockerCompose(
    CORE_PACKAGE_NAME,
    params
  );

  const docker = {
    compose: {
      rm: sinon.stub(),
      down: sinon.stub(),
      up: sinon.stub()
    },
    safe: {
      compose: {
        up: sinon.stub()
      }
    },
    volume: {
      rm: sinon.stub()
    }
  };
  // Declare stub behaviour. If done chaining methods, sinon returns an erorr:

  const dockerList = {
    listContainers: async () => [
      {
        name: CORE_PACKAGE_NAME,
        isCore: true,
        volumes: [{ name: "vol1" }, { name: "vol2" }]
      },
      {
        name: PACKAGE_NAME,
        volumes: [{ name: "vol3" }]
      }
    ]
  };

  const restartPackageVolumes = proxyquire("calls/restartPackageVolumes", {
    "modules/docker": docker,
    "modules/dockerList": dockerList,
    params: params
  });

  before(() => {
    for (const path of [DOCKERCOMPOSE_PATH, CORE_DOCKERCOMPOSE_PATH]) {
      validate.path(path);
      fs.writeFileSync(path, "docker-compose");
    }
  });

  it("should remove the package volumes of a CORE", async () => {
    const res = await restartPackageVolumes({ id: CORE_PACKAGE_NAME });
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.volume.rm, "vol1 vol2");
    sinon.assert.called(docker.safe.compose.up);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should remove the package volumes of a NOT CORE", async () => {
    const res = await restartPackageVolumes({ id: PACKAGE_NAME });
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.called(docker.compose.down);
    sinon.assert.called(docker.safe.compose.up);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
    fs.unlinkSync(CORE_DOCKERCOMPOSE_PATH);
  });
});
