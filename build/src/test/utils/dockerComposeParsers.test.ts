import "mocha";
import { expect } from "chai";
import { pick } from "lodash";
import {
  PortProtocol,
  VolumeMapping,
  Compose,
  UserSettings
} from "../../src/types";

import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings,
  parseEnvironment,
  stringifyEnvironment,
  mergePortArrays,
  parseVolumeMappings,
  stringifyVolumeMappings,
  normalizeVolumePath,
  parseUserSetFromCompose,
  applyUserSet,
  getDevicePath,
  parseDevicePath,
  parseDevicePathMountpoint,
  legacyTag
} from "../../src/utils/dockerComposeParsers";
import { mockCompose, mockDnpName, mockComposeService } from "../testUtils";

const bitcoinVolumeName = "bitcoin_data";
const bitcoinVolumeNameNew = "bitcoin_new_data";

describe("Util: dockerComposeParsers", () => {
  describe("environment: parse, stringify", () => {
    const envsArray = ["NAME=VALUE", "NOVAL", "COMPLEX=D=D=D  = 2"];
    const envs = {
      NAME: "VALUE",
      NOVAL: "",
      COMPLEX: "D=D=D  = 2"
    };

    it("Should parse an envsArray", () => {
      expect(parseEnvironment(envsArray)).to.deep.equal(envs);
    });

    it("Should stringify an envs object", () => {
      expect(stringifyEnvironment(envs)).to.deep.equal(envsArray);
    });
  });

  describe("portMappings: parse, stringify and merge", () => {
    it("should parse and stringify port mappings", () => {
      const portArray = ["4001", "5001/udp", "30303:30303", "30303:30303/udp"];
      const portMappings = [
        { container: 4001, protocol: "TCP" as PortProtocol },
        { container: 5001, protocol: "UDP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "UDP" as PortProtocol }
      ];

      expect(parsePortMappings(portArray)).to.deep.equal(
        portMappings,
        "Wrong parse"
      );

      expect(stringifyPortMappings(portMappings)).to.deep.equal(
        portArray,
        "Wrong stringify"
      );
    });

    it("should merge port mappings", () => {
      const portMappings1 = [
        { container: 5001, protocol: "UDP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "UDP" as PortProtocol },
        { container: 60606, protocol: "TCP" as PortProtocol }
      ];

      const portMappings2 = [
        { container: 4001, protocol: "TCP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "UDP" as PortProtocol },
        { host: 60606, container: 60606, protocol: "TCP" as PortProtocol }
      ];

      const mergedPortMappings = mergePortMappings(
        portMappings1,
        portMappings2
      );

      expect(mergedPortMappings).to.deep.equal([
        { container: 5001, protocol: "UDP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "UDP" as PortProtocol },
        { container: 60606, protocol: "TCP" as PortProtocol },
        { container: 4001, protocol: "TCP" as PortProtocol }
      ]);
    });

    it("should parse, merge and stringify two port arrays", () => {
      // Change the host of a port and add another one.
      const portArray1 = ["30656:30303/udp", "8080:8080"];
      const portArray2 = ["4001:4001", "30303:30303/udp"];

      const mergedPortMappings = mergePortArrays(portArray1, portArray2);

      expect(mergedPortMappings).to.deep.equal([
        "30656:30303/udp",
        "8080:8080",
        "4001:4001"
      ]);
    });
  });

  describe("volumeMappings: parse, stringify and merge", () => {
    it("should parse and stringify volume mappings", () => {
      const volumeArray = [
        "/etc/hostname:/etc/vpnname:ro",
        "/var/run/docker.sock:/var/run/docker.sock",
        "vpndnpdappnodeeth_shared:/var/spool/openvpn"
      ];
      const volumeMappings: VolumeMapping[] = [
        {
          container: "/etc/vpnname:ro",
          host: "/etc/hostname",
          name: undefined
        },
        {
          container: "/var/run/docker.sock",
          host: "/var/run/docker.sock",
          name: undefined
        },
        {
          container: "/var/spool/openvpn",
          host: "vpndnpdappnodeeth_shared",
          name: "vpndnpdappnodeeth_shared"
        }
      ];

      expect(parseVolumeMappings(volumeArray)).to.deep.equal(
        volumeMappings,
        "Wrong parse"
      );

      expect(stringifyVolumeMappings(volumeMappings)).to.deep.equal(
        volumeArray,
        "Wrong stringify"
      );
    });

    describe("Path normalization", () => {
      const paths = [
        { path: "/", res: "/" },
        { path: "/root/.ethereum/", res: "/root/.ethereum" },
        { path: "/hello///", res: "/hello" },
        { path: "ethchain_geth", res: "ethchain_geth" },
        { path: "data", res: "data" }
      ];
      for (const { path, res } of paths)
        it(`Should normalize ${path}`, () => {
          expect(normalizeVolumePath(path)).to.equal(res);
        });
    });
  });

  describe("parseUserSet", () => {
    it("Should parse the user set variable", () => {
      const compose: Compose = {
        ...mockCompose,
        services: {
          [mockDnpName]: {
            ...mockComposeService,
            environment: ["ORIGINAL=0", "USERSET=1"],
            ports: ["4001:4001", "9090:9090", "32764:6000"],
            volumes: [
              "/dev1/custom-path:/usr/data0",
              "moredata:/usr/data1",
              `${bitcoinVolumeNameNew}:/usr/data2`
            ],
            labels: {
              "dappnode.dnp.default.environment": "[]",
              "dappnode.dnp.default.ports": "[]",
              "dappnode.dnp.default.volumes": `["${bitcoinVolumeName}:/usr/data0", "moredata:/usr/data1", "${bitcoinVolumeNameNew}:/usr/data2"]`
            }
          }
        },
        volumes: {
          bitcoinVolumeName: {},
          moredata: {},
          [bitcoinVolumeNameNew]: {
            /* eslint-disable-next-line @typescript-eslint/camelcase */
            driver_opts: {
              device: `/dev0/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/${bitcoinVolumeNameNew}`,
              o: "bind",
              type: "none"
            }
          }
        }
      };

      const userSettings = parseUserSetFromCompose(compose);

      const expectedUserSet: UserSettings = {
        environment: {
          ORIGINAL: "0",
          USERSET: "1"
        },
        namedVolumeMountpoints: {
          [bitcoinVolumeNameNew]: "/dev0/data",
          moredata: "",
          // ##### DEPRECATED
          [bitcoinVolumeName]: legacyTag + "/dev1/custom-path"
        },
        portMappings: {
          "4001/TCP": "4001",
          "6000/TCP": "32764",
          "9090/TCP": "9090"
        }
      };

      expect(userSettings).to.deep.equal(expectedUserSet);
    });

    it("Should parse a legacy bitcoin DNP without default.volumes", () => {
      const bitcoinName = "bitcoin.dnp.dappnode.eth";
      const compose: Compose = {
        ...mockCompose,
        services: {
          [bitcoinName]: {
            ...mockComposeService,
            volumes: ["/dev1/custom-path:/root/.bitcoin", "moredata:/usr/data2"]
          }
        },
        volumes: {
          [bitcoinVolumeName]: {},
          moredata: {}
        }
      };

      const userSettings = parseUserSetFromCompose(compose);

      const expectedUserSet: UserSettings = {
        environment: {},
        namedVolumeMountpoints: {
          moredata: "",
          // ##### DEPRECATED
          [bitcoinVolumeName]: legacyTag + "/dev1/custom-path"
        },
        portMappings: {}
      };

      expect(userSettings).to.deep.equal(expectedUserSet);
    });
  });

  describe("applyUserSet", () => {
    it("Should apply some user settings", () => {
      const environment = ["ORIGINAL=VALUE", "USERSET=VALUE"];
      const ports = ["4001:4001", "9090:9090/udp", "32764:6000"];
      const volumes = [
        `${bitcoinVolumeNameNew}:/usr/data0`,
        "/dev1/custom-path:/usr/data1",
        `${bitcoinVolumeName}:/usr/data2`
      ];

      const compose: Compose = {
        ...mockCompose,
        services: {
          [mockDnpName]: {
            ...mockComposeService,
            environment,
            ports,
            volumes
          }
        },
        volumes: {
          [bitcoinVolumeNameNew]: {},
          [bitcoinVolumeName]: {}
        }
      };

      const userSet: UserSettings = {
        environment: {
          USERSET: "NEW_VALUE"
        },
        namedVolumeMountpoints: {
          [bitcoinVolumeNameNew]: "/dev0/data",
          // ##### DEPRECATED
          [bitcoinVolumeName]: legacyTag + "/dev2/user-set-path"
        },
        portMappings: {
          "4001/TCP": "4111",
          "9090/UDP": ""
        }
      };

      const composeReturn = applyUserSet(compose, userSet);
      const expectedCompose: Compose = {
        ...compose,
        services: {
          [mockDnpName]: {
            ...mockComposeService,
            environment: ["ORIGINAL=VALUE", "USERSET=NEW_VALUE"],
            ports: ["4111:4001", "9090/udp", "32764:6000"],
            volumes: [
              `${bitcoinVolumeNameNew}:/usr/data0`,
              "/dev1/custom-path:/usr/data1",
              "/dev2/user-set-path:/usr/data2"
            ],
            labels: {
              "dappnode.dnp.default.environment": JSON.stringify(environment),
              "dappnode.dnp.default.ports": JSON.stringify(ports),
              "dappnode.dnp.default.volumes": JSON.stringify(volumes)
            }
          }
        },
        volumes: {
          ...compose.volumes,
          [bitcoinVolumeNameNew]: {
            /* eslint-disable-next-line @typescript-eslint/camelcase */
            driver_opts: {
              device: `/dev0/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/${bitcoinVolumeNameNew}`,
              o: "bind",
              type: "none"
            }
          }
        }
      };
      expect(composeReturn).to.deep.equal(expectedCompose);
    });

    it("Should apply a setting to make a host port ephemeral", () => {
      const compose: Compose = {
        ...mockCompose,
        services: {
          [mockDnpName]: {
            ...mockComposeService,
            ports: ["3333/udp", "4444:4444/udp"]
          }
        }
      };

      const userSet: UserSettings = {
        portMappings: { "3333/UDP": "3330", "4444/UDP": "" }
      };

      const expectedServiceParts = {
        ports: ["3330:3333/udp", "4444/udp"]
      };
      const composeReturn = applyUserSet(compose, userSet);
      const serviceParts = pick(composeReturn.services[mockDnpName], ["ports"]);

      expect(serviceParts).to.deep.equal(expectedServiceParts);
    });
  });

  describe("device path", () => {
    const pathParts = {
      mountpoint: "/dev1/data",
      dnpName: "bitcoin.dnp.dappnode.eth",
      volumeName: "data",
      volumePath: "bitcoin.dnp.dappnode.eth/data",
      mountpointPath: "/dev1/data/dappnode-volumes"
    };
    const devicePath =
      "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data";

    it("Should get a device path", () => {
      expect(getDevicePath(pathParts)).to.equal(devicePath);
    });

    it("Should parse a device path", () => {
      expect(parseDevicePath(devicePath)).to.deep.equal(pathParts);
    });

    it("Should parse a device path mountpoint", () => {
      expect(parseDevicePathMountpoint(devicePath)).to.equal(
        pathParts.mountpoint
      );
    });
  });
});
