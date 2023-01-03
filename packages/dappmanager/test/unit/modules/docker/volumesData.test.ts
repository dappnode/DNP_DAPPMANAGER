import "mocha";
import { expect } from "chai";
import {
  parseVolumeOwnershipData,
  normalizeProjectName
} from "../../../../src/modules/docker/volumesData";
import { PackageContainer, VolumeOwnershipData } from "@dappnode/common";

describe("docker > volumes data", () => {
  describe("normalizeProjectName", () => {
    const cases: { [dnpName: string]: string } = {
      "main.dnp.dappnode.eth": "maindnpdappnodeeth",
      "dependency.dnp.dappnode.eth": "dependencydnpdappnodeeth",
      "lightning-network.dnp.dappnode.eth": "lightning-networkdnpdappnodeeth"
    };
    for (const dnpName in cases) {
      it(`Normalize project name ${dnpName}`, () => {
        expect(normalizeProjectName(dnpName)).to.equal(cases[dnpName]);
      });
    }
  });

  describe("parseVolumeOwnershipData", () => {
    it("Should parse ownership data of a shared volume", () => {
      const containers: PackageContainer[] = [
        {
          containerId:
            "38e0f958856d16076bb241fa72d80bded9b4fd1101e5a7dbe29be68e9a61434d",
          containerName: "DAppNodePackage-main.dnp.dappnode.eth",
          dnpName: "main.dnp.dappnode.eth",
          serviceName: "main.dnp.dappnode.eth",
          instanceName: "",
          version: "0.1.0",
          isDnp: true,
          isCore: false,
          created: 1592689345,
          image: "main.dnp.dappnode.eth:0.1.0",
          ip: "172.22.0.3",
          ports: [],
          volumes: [
            {
              host: "/var/lib/docker/volumes/maindnpdappnodeeth_changeme-main/_data",
              container: "/temp",
              name: "maindnpdappnodeeth_changeme-main"
            },
            {
              host: "/var/lib/docker/volumes/maindnpdappnodeeth_data/_data",
              container: "/usr",
              name: "maindnpdappnodeeth_data"
            },
            {
              host: "/var/lib/docker/volumes/dependencydnpdappnodeeth_data/_data",
              container: "/usrdep",
              name: "dependencydnpdappnodeeth_data"
            }
          ],
          networks: [],
          state: "running",
          running: true,
          exitCode: null,
          dependencies: {},
          avatarUrl: "",
          origin: "QmQc7QS7n7311Sc9EhjPqLkpgGWMNNdC2kcYa5GSQUB4jf",
          canBeFullnode: false
        },
        {
          containerId:
            "c44f7803a4192db211367f5558dfee0ec48b3b800e5638e06bb43edf8b74cd1c",
          containerName: "DAppNodePackage-dependency.dnp.dappnode.eth",
          dnpName: "dependency.dnp.dappnode.eth",
          serviceName: "dependency.dnp.dappnode.eth",
          instanceName: "",
          version: "0.1.0",
          isDnp: true,
          isCore: false,
          created: 1592689343,
          image: "dependency.dnp.dappnode.eth:0.1.0",
          ip: "172.22.0.2",
          ports: [],
          volumes: [
            {
              host: "/home/lion/Code/dappnode/DNP_DAPPMANAGER/packages/dappmanager/test_mountpoints/dnplifecycle-dep/testBind",
              container: "/temp"
            },
            {
              host: "/var/lib/docker/volumes/dependencydnpdappnodeeth_data/_data",
              container: "/usr",
              name: "dependencydnpdappnodeeth_data"
            }
          ],
          networks: [],
          state: "running",
          running: true,
          exitCode: null,
          dependencies: {},
          avatarUrl: "",
          origin: "QmNpp6BbDd4MG5agdvNHwTnRew1uhPPehTUYyvtpbDLgEr",
          canBeFullnode: false
        }
      ];

      const vol_dependencydnpdappnodeeth_data = {
        CreatedAt: "2020-06-20T23:42:23+02:00",
        Driver: "local",
        Labels: {
          "com.docker.compose.project": "dependencydnpdappnodeeth",
          "com.docker.compose.version": "1.22.0",
          "com.docker.compose.volume": "data"
        },
        Mountpoint:
          "/var/lib/docker/volumes/dependencydnpdappnodeeth_data/_data",
        Name: "dependencydnpdappnodeeth_data",
        Options: null,
        Scope: "local"
      };

      const expectedVolOwnershipData: VolumeOwnershipData = {
        name: "dependencydnpdappnodeeth_data",
        owner: "dependency.dnp.dappnode.eth"
      };

      const volOwnershipData = parseVolumeOwnershipData(
        vol_dependencydnpdappnodeeth_data,
        containers
      );

      expect(volOwnershipData).to.deep.equal(expectedVolOwnershipData);
    });
  });
});
