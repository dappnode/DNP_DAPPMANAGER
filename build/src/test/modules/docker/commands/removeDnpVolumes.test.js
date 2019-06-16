const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");
const params = require("params");

chai.should();

describe("docker > removeDnpVolumes", function() {
  const dnpNameCore = "testCore.dnp.dappnode.eth";
  const dappmanagerId = "dappmanager.dnp.dappnode.eth";
  const noVolsDnpName = "no-vols.dnp.dappnode.eth";
  const nginxId = "nginx-proxy.dnp.dappnode.eth";
  const letsencryptId = "letsencrypt-nginx.dnp.dappnode.eth";

  // docker-compose.yml will be generated for this DNP ids
  const ids = [dnpNameCore, nginxId, letsencryptId];

  const dnpList = [
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
          name: "nginxproxydnpdappnodeeth_vhost.d",
          users: [
            "letsencrypt-nginx.dnp.dappnode.eth",
            "nginx-proxy.dnp.dappnode.eth"
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
            "letsencrypt-nginx.dnp.dappnode.eth",
            "nginx-proxy.dnp.dappnode.eth"
          ],
          owner: "nginx-proxy.dnp.dappnode.eth",
          isOwner: true
        },
        {
          name:
            "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
          users: ["nginx-proxy.dnp.dappnode.eth"],
          owner: "nginx-proxy.dnp.dappnode.eth",
          isOwner: true
        }
      ]
    }
  ];

  const composeRm = sinon.stub();
  const composeUp = sinon.stub();
  const volumeRm = sinon.stub();
  const getDnpExtendedData = async id => {
    const dnp = dnpList.find(({ name }) => name === id);
    if (!dnp) throw Error("NOTFOUND");
    return dnp;
  };

  // Declare stub behaviour. If done chaining methods, sinon returns an erorr:

  const restartPackageVolumes = proxyquire(
    "modules/docker/commands/removeDnpVolumes",
    {
      "../lowLevelCommands/checkDnpBlacklist": () => {},
      "../lowLevelCommands/composeRm": composeRm,
      "../lowLevelCommands/composeUp": composeUp,
      "../lowLevelCommands/getComposeInstance": () => {},
      "../lowLevelCommands/volumeRm": volumeRm,
      "./getDnpExtendedData": getDnpExtendedData,
      params: params
    }
  );

  before(() => {
    for (const id of ids) {
      const dockerComposePath = getPath.dockerCompose(id, params);
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    }
  });

  beforeEach(() => {
    composeRm.resetHistory();
    composeUp.resetHistory();
    volumeRm.resetHistory();
  });

  it(`Should remove the package volumes of ${nginxId}`, async () => {
    const res = await restartPackageVolumes(nginxId);

    // Assert correct call order docker rm
    sinon.assert.called(composeRm);
    const dnpsInOrder = [nginxId, letsencryptId];
    dnpsInOrder.forEach((volName, i) => {
      expect(composeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong dnpName on composeRm call #${i}`
      );
    });

    // Assert correct call order for volumeRm
    const volumesInOrder = [
      "nginxproxydnpdappnodeeth_vhost.d",
      "nginxproxydnpdappnodeeth_html",
      "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b"
    ];
    volumesInOrder.forEach((volName, i) => {
      expect(volumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on volumeRm call #${i}`
      );
    });

    // Assert correct call order docker up
    sinon.assert.called(composeUp);
    dnpsInOrder.forEach((volName, i) => {
      expect(composeUp.getCall(i).args[0]).to.equal(
        volName,
        `Wrong dnpName on composeUp call #${i}`
      );
    });

    // Assert successful return
    expect(res).to.deep.equal(volumesInOrder);
  });

  it("Should remove the package volumes of a CORE", async () => {
    const res = await restartPackageVolumes(dnpNameCore);
    // sinon.assert.called(composeRm);
    sinon.assert.called(composeRm);
    // Assert correct call order for volumeRm
    const volumesInOrder = ["vol1", "vol2"];
    volumesInOrder.forEach((volName, i) => {
      expect(volumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on volumeRm call #${i}`
      );
    });
    sinon.assert.called(composeUp);

    // Assert successful return
    expect(res).to.deep.equal(volumesInOrder);
  });

  it("Should NOT allow id = dappmanager.dnp.dappnode.eth", async () => {
    let err = "did not throw";
    try {
      await restartPackageVolumes({ id: "dappmanager.dnp.dappnode.eth" });
    } catch (e) {
      err = e.message;
    }
    expect(err).to.equal("NOTFOUND");
  });

  it("Should early return if the DNP has no volumes", async () => {
    const res = await restartPackageVolumes(noVolsDnpName);
    expect(res).to.equal(undefined);
  });

  after(() => {
    for (const id of ids) {
      const dockerComposePath = getPath.dockerCompose(id, params);
      fs.unlinkSync(dockerComposePath);
    }
  });
});
