import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import { PackageContainer } from "../../src/types";
import { mockDnp, mockVolume } from "../testUtils";
import rewiremock from "rewiremock";
// Imports for typings
import restartPackageVolumesType from "../../src/calls/restartPackageVolumes";

describe("Call function: restartPackageVolumes", function() {
  const dnpNameCore = "testCore.dnp.dappnode.eth";
  const dappmanagerId = "dappmanager.dnp.dappnode.eth";
  const noVolsDnpName = "no-vols.dnp.dappnode.eth";
  const nginxId = "nginx-proxy.dnp.dappnode.eth";
  // const letsencryptId = "letsencrypt-nginx.dnp.dappnode.eth";
  const raidenTestnetId = "raiden-testnet.dnp.dappnode.eth";

  // docker-compose.yml will be generated for this DNP ids
  const dockerRm = sinon.stub();
  const dockerVolumeRm = sinon.stub();
  const dockerComposeUpSafe = sinon.stub();
  const dockerVolumeInspect = sinon.stub().resolves({
    Driver: "local",
    Labels: {},
    Mountpoint: "/var/lib/docker/volumes/dappnodeeth_data/_data",
    Name: "dappnodeeth_data",
    Options: null,
    Scope: "local"
  });

  // Declare stub behaviour. If done chaining methods, sinon returns an erorr:

  const dnpList = [
    {
      ...mockDnp,
      name: dnpNameCore,
      isCore: true,
      volumes: [
        { ...mockVolume, name: "vol1", isOwner: true, users: [dnpNameCore] },
        { ...mockVolume, name: "vol2", isOwner: true, users: [dnpNameCore] }
      ]
    },
    {
      ...mockDnp,
      name: dappmanagerId,
      isCore: true,
      volumes: [
        {
          ...mockVolume,
          name: "dappmanager_vol",
          isOwner: true,
          users: [dappmanagerId]
        }
      ]
    },
    {
      ...mockDnp,
      name: noVolsDnpName,
      volumes: []
    },
    {
      ...mockDnp,
      name: nginxId,
      volumes: [
        {
          ...mockVolume,
          type: "bind",
          path: "/root/certs",
          dest: "/etc/nginx/certs"
        },

        {
          ...mockVolume,
          name: "nginxproxydnpdappnodeeth_vhost.d",
          users: [
            "letsencrypt-nginx.dnp.dappnode.eth",
            "nginx-proxy.dnp.dappnode.eth"
          ],
          owner: "nginx-proxy.dnp.dappnode.eth",
          isOwner: true
        },
        {
          ...mockVolume,
          type: "bind",
          path: "/var/run/docker.sock",
          dest: "/tmp/docker.sock"
        },
        {
          ...mockVolume,
          name: "nginxproxydnpdappnodeeth_html",
          users: [
            "letsencrypt-nginx.dnp.dappnode.eth",
            "nginx-proxy.dnp.dappnode.eth"
          ],
          owner: "nginx-proxy.dnp.dappnode.eth",
          isOwner: true
        },
        {
          ...mockVolume,
          name:
            "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
          users: ["nginx-proxy.dnp.dappnode.eth"],
          owner: "nginx-proxy.dnp.dappnode.eth",
          isOwner: true
        }
      ]
    },
    {
      ...mockDnp,
      name: raidenTestnetId,
      isCore: false,
      volumes: [
        {
          ...mockVolume,
          name: "raidentestnetdnpdappnodeeth_data",
          isOwner: true,
          users: [raidenTestnetId]
        }
      ]
    }
  ].map(dnp => ({
    ...dnp,
    packageName: dnp.isCore
      ? `DAppNodePackage-${dnp.name}`
      : `DAppNodeCore-${dnp.name}`
  }));

  async function listContainers(): Promise<PackageContainer[]> {
    return dnpList;
  }

  let restartPackageVolumes: typeof restartPackageVolumesType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/calls/restartPackageVolumes"),
      mock => {
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerRm, dockerVolumeRm })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerSafe"))
          .with({ dockerComposeUpSafe })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerApi"))
          .with({ dockerVolumeInspect })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainers })
          .toBeUsed();
      }
    );
    restartPackageVolumes = mock.default;
  });

  before(() => {
    for (const { name, isCore } of dnpList) {
      const dockerComposePath = getPath.dockerCompose(name, isCore);
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    }
  });

  beforeEach(() => {
    dockerRm.resetHistory();
    dockerComposeUpSafe.resetHistory();
    dockerVolumeRm.resetHistory();
  });

  it(`Should remove the package volumes of ${nginxId}`, async () => {
    const res = await restartPackageVolumes({ id: nginxId });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");

    // Assert correct call order docker rm
    sinon.assert.called(dockerRm);
    const dnpsInOrder = [nginxId];
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerRm.getCall(i).args[0]).to.include(
        volName,
        `Wrong dnpName on dockerRm call #${i}`
      );
    });

    // Assert correct call order for volumeRm
    const volumesInOrder = [
      "nginxproxydnpdappnodeeth_vhost.d",
      "nginxproxydnpdappnodeeth_html",
      "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b"
    ];
    volumesInOrder.forEach((volName, i) => {
      expect(dockerVolumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on dockerVolumeRm call #${i}`
      );
    });

    // Assert correct call order docker up
    sinon.assert.called(dockerComposeUpSafe);
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerComposeUpSafe.getCall(i).args[0]).to.includes(
        volName,
        `Wrong dnpName on dockerComposeUpSafe call #${i}`
      );
    });
  });

  it(`Should remove the package volumes of ${dnpNameCore} (core)`, async () => {
    const res = await restartPackageVolumes({ id: dnpNameCore });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");

    // sinon.assert.called(dockerRm);
    sinon.assert.called(dockerRm);
    // Assert correct call order for volumeRm
    const volumesInOrder = ["vol1", "vol2"];
    volumesInOrder.forEach((volName, i) => {
      expect(dockerVolumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on dockerVolumeRm call #${i}`
      );
    });
    sinon.assert.called(dockerComposeUpSafe);
  });

  it(`Should remove only one of the package volumes of ${dnpNameCore} (core)`, async () => {
    const res = await restartPackageVolumes({
      id: dnpNameCore,
      volumeId: "vol1"
    });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");

    // sinon.assert.called(docker.compose.rm);
    sinon.assert.callCount(dockerRm, 1);
    // Assert correct call order for volumeRm
    const volumesInOrder = ["vol1"];
    volumesInOrder.forEach((volName, i) => {
      expect(dockerVolumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on docker.volume.rm call #${i}`
      );
    });
    sinon.assert.called(dockerComposeUpSafe);
  });

  it(`Should remove the package volumes of ${raidenTestnetId}`, async () => {
    const res = await restartPackageVolumes({ id: raidenTestnetId });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");

    // Assert correct call order docker rm
    sinon.assert.called(dockerRm);
    const dnpsInOrder = [raidenTestnetId];
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerRm.getCall(i).args[0]).to.include(
        volName,
        `Wrong dnpName on dockerRm call #${i}`
      );
    });

    // Assert correct call order for volumeRm
    const volumesInOrder = ["raidentestnetdnpdappnodeeth_data"];
    volumesInOrder.forEach((volName, i) => {
      expect(dockerVolumeRm.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on dockerVolumeRm call #${i}`
      );
    });

    // Assert correct call order docker up
    sinon.assert.called(dockerComposeUpSafe);
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerComposeUpSafe.getCall(i).args[0]).to.includes(
        volName,
        `Wrong dnpName on dockerComposeUpSafe call #${i}`
      );
    });
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
    // sinon.assert.called(dockerRm);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res.message).to.equal(
      "no-vols.dnp.dappnode.eth has no named volumes"
    );
  });

  after(() => {
    for (const { name, isCore } of dnpList) {
      const dockerComposePath = getPath.dockerCompose(name, isCore);
      fs.unlinkSync(dockerComposePath);
    }
  });
});
