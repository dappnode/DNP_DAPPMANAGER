import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../../src/utils/getPath";
import * as validate from "../../../src/utils/validate";
import { PackageContainer, VolumeOwnershipData } from "../../../src/types";
import { mockDnp, mockVolume } from "../../testUtils";
import rewiremock from "rewiremock";
// Imports for typings
import { packageRestartVolumes as packageRestartVolumesType } from "../../../src/calls/packageRestartVolumes";
import { sortDnpsToRemove } from "../../../src/modules/docker/restartPackageVolumes";

describe("Docker action: restartPackageVolumes", function() {
  const dnpNameCore = "testCore.dnp.dappnode.eth";
  const dappmanagerId = "dappmanager.dnp.dappnode.eth";
  const noVolsDnpName = "no-vols.dnp.dappnode.eth";
  const nginxId = "nginx-proxy.dnp.dappnode.eth";
  // const letsencryptId = "letsencrypt-nginx.dnp.dappnode.eth";
  const raidenTestnetId = "raiden-testnet.dnp.dappnode.eth";

  // Vol names
  const dappmanagerVolName = "dncore_dappmanagerdnpdappnodeeth_data";

  // docker-compose.yml will be generated for this DNP ids
  const dockerRm = sinon.stub();
  const removeNamedVolume = sinon.stub();
  const dockerComposeUp = sinon.stub();

  // Declare stub behaviour. If done chaining methods, sinon returns an erorr:

  const dnpList: PackageContainer[] = [
    {
      ...mockDnp,
      name: dnpNameCore,
      isCore: true,
      volumes: [
        { ...mockVolume, name: "vol1" },
        { ...mockVolume, name: "vol2" }
      ]
    },
    {
      ...mockDnp,
      name: dappmanagerId,
      isCore: true,
      volumes: [
        {
          ...mockVolume,
          name: dappmanagerVolName
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
          host: "/root/certs",
          container: "/etc/nginx/certs"
        },

        {
          ...mockVolume,
          name: "nginxproxydnpdappnodeeth_vhost.d"
        },
        {
          ...mockVolume,
          host: "/var/run/docker.sock",
          container: "/tmp/docker.sock"
        },
        {
          ...mockVolume,
          name: "nginxproxydnpdappnodeeth_html"
        },
        {
          ...mockVolume,
          name:
            "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b"
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
          name: "raidentestnetdnpdappnodeeth_data"
        }
      ]
    }
  ].map(
    (dnp): PackageContainer => ({
      // Must add the container name since dockerRm is called with that
      ...dnp,
      dnpName: dnp.name
    })
  );

  const volumesData: VolumeOwnershipData[] = [
    // Mock core volumes
    {
      name: "vol1",
      users: [dnpNameCore],
      owner: dnpNameCore
    },
    {
      name: "vol2",
      users: [dnpNameCore],
      owner: dnpNameCore
    },

    // Dappmanager volumes
    {
      name: dappmanagerVolName,
      users: [dappmanagerId],
      owner: dappmanagerId
    },

    // Nginx volumes
    {
      name: "nginxproxydnpdappnodeeth_vhost.d",
      users: [
        "letsencrypt-nginx.dnp.dappnode.eth",
        "nginx-proxy.dnp.dappnode.eth"
      ],
      owner: "nginx-proxy.dnp.dappnode.eth"
    },
    {
      name: "nginxproxydnpdappnodeeth_html",
      users: [
        "letsencrypt-nginx.dnp.dappnode.eth",
        "nginx-proxy.dnp.dappnode.eth"
      ],
      owner: "nginx-proxy.dnp.dappnode.eth"
    },
    {
      name: "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
      users: ["nginx-proxy.dnp.dappnode.eth"],
      owner: "nginx-proxy.dnp.dappnode.eth"
    },

    // Raiden testnet volumes
    {
      name: "raidentestnetdnpdappnodeeth_data",
      users: [raidenTestnetId],
      owner: raidenTestnetId
    }
  ];

  async function listContainers(): Promise<PackageContainer[]> {
    return dnpList;
  }

  async function getVolumesOwnershipData(): Promise<VolumeOwnershipData[]> {
    return volumesData;
  }

  let packageRestartVolumes: typeof packageRestartVolumesType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../src/calls/packageRestartVolumes"),
      mock => {
        mock(() => import("../../../src/modules/docker/dockerCommands"))
          .with({ dockerRm, dockerComposeUp })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/listContainers"))
          .with({ listContainers })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/volumesData"))
          .with({ getVolumesOwnershipData })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/removeNamedVolume"))
          .with({ removeNamedVolume })
          .toBeUsed();
      }
    );
    packageRestartVolumes = mock.packageRestartVolumes;
  });

  before(() => {
    for (const dnp of dnpList) {
      const dockerComposePath = getPath.dockerCompose(dnp.dnpName, dnp.isCore);
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    }
  });

  beforeEach(() => {
    dockerRm.resetHistory();
    dockerComposeUp.resetHistory();
    removeNamedVolume.resetHistory();
  });

  it(`Should remove the package volumes of ${nginxId}`, async () => {
    await packageRestartVolumes({ dnpName: nginxId });

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
      expect(removeNamedVolume.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on removeNamedVolume call #${i}`
      );
    });

    // Assert correct call order docker up
    sinon.assert.called(dockerComposeUp);
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerComposeUp.getCall(i).args[0]).to.includes(
        volName,
        `Wrong dnpName on dockerComposeUp call #${i}`
      );
    });
  });

  it(`Should remove the package volumes of ${dnpNameCore} (core)`, async () => {
    await packageRestartVolumes({ dnpName: dnpNameCore });

    // sinon.assert.called(dockerRm);
    sinon.assert.called(dockerRm);
    // Assert correct call order for volumeRm
    const volumesInOrder = ["vol1", "vol2"];
    volumesInOrder.forEach((volName, i) => {
      expect(removeNamedVolume.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on removeNamedVolume call #${i}`
      );
    });
    sinon.assert.called(dockerComposeUp);
  });

  it(`Should remove only one of the package volumes of ${dnpNameCore} (core)`, async () => {
    await packageRestartVolumes({ dnpName: dnpNameCore, volumeId: "vol1" });

    // sinon.assert.called(docker.compose.rm);
    sinon.assert.callCount(dockerRm, 1);
    // Assert correct call order for volumeRm
    const volumesInOrder = ["vol1"];
    volumesInOrder.forEach((volName, i) => {
      expect(removeNamedVolume.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on docker.volume.rm call #${i}`
      );
    });
    sinon.assert.called(dockerComposeUp);
  });

  it(`Should remove the package volumes of ${raidenTestnetId}`, async () => {
    await packageRestartVolumes({ dnpName: raidenTestnetId });

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
      expect(removeNamedVolume.getCall(i).args[0]).to.equal(
        volName,
        `Wrong volume name on removeNamedVolume call #${i}`
      );
    });

    // Assert correct call order docker up
    sinon.assert.called(dockerComposeUp);
    dnpsInOrder.forEach((volName, i) => {
      expect(dockerComposeUp.getCall(i).args[0]).to.includes(
        volName,
        `Wrong dnpName on dockerComposeUp call #${i}`
      );
    });
  });

  it("Should NOT allow id = dappmanager.dnp.dappnode.eth", async () => {
    let err = "did not throw";
    try {
      await packageRestartVolumes({ dnpName: "dappmanager.dnp.dappnode.eth" });
    } catch (e) {
      err = e.message;
    }
    expect(err).to.equal("The dappmanager cannot be restarted");
  });

  it("Should early return if the DNP has no volumes", async () => {
    await packageRestartVolumes({ dnpName: noVolsDnpName });
  });

  after(() => {
    for (const dnp of dnpList) {
      const dockerComposePath = getPath.dockerCompose(dnp.dnpName, dnp.isCore);
      fs.unlinkSync(dockerComposePath);
    }
  });
});

describe("sortDnpsToRemove", () => {
  it("Should sort packages to remove", () => {
    const dnpNameMain = "main.dnp.dappnode.eth";
    const dnpNameDep = "dependency.dnp.dappnode.eth";
    const dnpsToRemove = [dnpNameMain, dnpNameDep];
    const dnpsToRemoveSorted = sortDnpsToRemove(dnpsToRemove, dnpNameDep);

    const expectedDnpsToRemoveSorted = [dnpNameDep, dnpNameMain];

    expect(dnpsToRemoveSorted).to.deep.equal(expectedDnpsToRemoveSorted);
  });
});
