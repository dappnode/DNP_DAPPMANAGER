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

  const dnpName = "testCore.dnp.dappnode.eth";
  const dappmanagerId = "dappmanager.dnp.dappnode.eth";
  const noVolsDnpName = "no-vols.dnp.dappnode.eth";
  const dockerComposePath = getPath.dockerCompose(dnpName, params);

  const docker = {
    compose: {
      rm: sinon.stub(),
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
        name: dnpName,
        isCore: true,
        volumes: [{ name: "vol1" }, { name: "vol2" }]
      },
      {
        name: dappmanagerId,
        isCore: true,
        volumes: [{ name: "dappmanager_vol" }]
      },
      {
        name: noVolsDnpName,
        volumes: []
      }
    ]
  };

  const restartPackageVolumes = proxyquire("calls/restartPackageVolumes", {
    "modules/docker": docker,
    "modules/dockerList": dockerList,
    params: params
  });

  before(() => {
    for (const path of [dockerComposePath, dockerComposePath]) {
      validate.path(path);
      fs.writeFileSync(path, "docker-compose");
    }
  });

  it("should remove the package volumes of a CORE", async () => {
    const res = await restartPackageVolumes({ id: dnpName });
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.volume.rm, "vol1 vol2");
    sinon.assert.called(docker.safe.compose.up);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should NOT allow id = dappmanager.dnp.dappnode.eth", async () => {
    let err = "did not throw";
    try {
      await restartPackageVolumes({ id: "dappmanager.dnp.dappnode.eth" });
    } catch (e) {
      err = e.message;
    }
    expect(err).to.equal("The dappmanager cannot be restarted");
  });

  it("should early return if the DNP has no volumes", async () => {
    const res = await restartPackageVolumes({ id: noVolsDnpName });
    // sinon.assert.called(docker.compose.rm);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res.message).to.equal(
      "no-vols.dnp.dappnode.eth has no named volumes"
    );
  });

  after(() => {
    fs.unlinkSync(dockerComposePath);
  });
});
