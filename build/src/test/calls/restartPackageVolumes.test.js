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

  const dnpNameCore = "testCore.dnp.dappnode.eth";
  const dappmanagerId = "dappmanager.dnp.dappnode.eth";
  const noVolsDnpName = "no-vols.dnp.dappnode.eth";
  const nginxId = "nginx-proxy.dnp.dappnode.eth";
  const letsencryptId = "letsencrypt-nginx.dnp.dappnode.eth";

  // docker-compose.yml will be generated for this DNP ids
  const ids = [dnpNameCore, nginxId, letsencryptId];

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
        name: dnpNameCore,
        isCore: true,
        volumes: [
          { name: "vol1", isOwner: true, users: [dnpNameCore] },
          { name: "vol2", isOwner: true, users: [dnpNameCore] }
        ]
      },
      {
        name: dappmanagerId,
        isCore: true,
        volumes: [
          { name: "dappmanager_vol", isOwner: true, users: [dappmanagerId] }
        ]
      },
      {
        name: noVolsDnpName,
        volumes: []
      },
      {
        name: nginxId,
        volumes: [
          {
            type: "bind",
            path: "/root/certs",
            dest: "/etc/nginx/certs"
          },
          {
            name:
              "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
            users: ["nginx-proxy.dnp.dappnode.eth"],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            name: "nginxproxydnpdappnodeeth_vhost.d",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          },
          {
            type: "bind",
            path: "/var/run/docker.sock",
            dest: "/tmp/docker.sock"
          },
          {
            name: "nginxproxydnpdappnodeeth_html",
            users: [
              "nginx-proxy.dnp.dappnode.eth",
              "letsencrypt-nginx.dnp.dappnode.eth"
            ],
            owner: "nginx-proxy.dnp.dappnode.eth",
            isOwner: true
          }
        ]
      }
    ]
  };

  const restartPackageVolumes = proxyquire("calls/restartPackageVolumes", {
    "modules/docker": docker,
    "modules/dockerList": dockerList,
    params: params
  });

  before(() => {
    for (const id of ids) {
      const dockerComposePath = getPath.dockerCompose(id, params);
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    }
  });

  it(`Should remove the package volumes of ${nginxId}`, async () => {
    const res = await restartPackageVolumes({ id: nginxId });
    // Assert docker rm
    sinon.assert.called(docker.compose.rm);
    expect(docker.compose.rm.getCall(0).args[0]).to.include(nginxId);
    expect(docker.compose.rm.getCall(1).args[0]).to.include(letsencryptId);
    // Assert docker volume rm
    sinon.assert.calledWith(
      docker.volume.rm,
      "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b nginxproxydnpdappnodeeth_vhost.d nginxproxydnpdappnodeeth_html"
    );
    // Assert docker up
    sinon.assert.called(docker.safe.compose.up);
    expect(docker.safe.compose.up.getCall(0).args[0]).to.include(nginxId);
    expect(docker.safe.compose.up.getCall(1).args[0]).to.include(letsencryptId);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("Should remove the package volumes of a CORE", async () => {
    const res = await restartPackageVolumes({ id: dnpNameCore });
    // sinon.assert.called(docker.compose.rm);
    sinon.assert.called(docker.compose.rm);
    sinon.assert.calledWith(docker.volume.rm, "vol1 vol2");
    sinon.assert.called(docker.safe.compose.up);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("Should NOT allow id = dappmanager.dnp.dappnode.eth", async () => {
    let err = "did not throw";
    try {
      await restartPackageVolumes({ id: "dappmanager.dnp.dappnode.eth" });
    } catch (e) {
      err = e.message;
    }
    expect(err).to.equal("The dappmanager cannot be restarted");
  });

  it("Should early return if the DNP has no volumes", async () => {
    const res = await restartPackageVolumes({ id: noVolsDnpName });
    // sinon.assert.called(docker.compose.rm);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res.message).to.equal(
      "no-vols.dnp.dappnode.eth has no named volumes"
    );
  });

  after(() => {
    for (const id of ids) {
      const dockerComposePath = getPath.dockerCompose(id, params);
      fs.unlinkSync(dockerComposePath);
    }
  });
});
