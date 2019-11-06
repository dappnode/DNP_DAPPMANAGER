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
  applyUserSet
} from "../../src/utils/dockerComposeParsers";
import { mockCompose, mockDnpName, mockComposeService } from "../testUtils";

const bitcoinDataVolumeName = "bitcoin_data";

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

    // it("should merge volume mappings", () => {
    //   const volumeMappings1: VolumeMapping[] = [
    //     { host: "/dev1/custom-path/bitcoin-data", container: "/root/.bitcoin" }
    //   ];

    //   const volumeMappings2: VolumeMapping[] = [
    //     { host: "bitcoin_data", container: "/root/.bitcoin" },
    //     { host: "/etc/another-path", container: "/etc/some-path" }
    //   ];

    //   const mergedVolumeMappings = mergeVolumeMappings(
    //     volumeMappings1,
    //     volumeMappings2
    //   );

    //   expect(mergedVolumeMappings).to.deep.equal([
    //     { host: "/dev1/custom-path/bitcoin-data", container: "/root/.bitcoin" },
    //     { host: "/etc/another-path", container: "/etc/some-path" }
    //   ]);
    // });

    // it("should parse, merge and stringify two volume arrays", () => {
    //   const volumeArray1 = ["/dev1/custom-path/bitcoin-data:/root/.bitcoin"];
    //   const volumeArray2 = ["bitcoin_data:/root/.bitcoin"];

    //   const mergedPortMappings = mergeVolumeArrays(volumeArray1, volumeArray2);

    //   expect(mergedPortMappings).to.deep.equal([
    //     "/dev1/custom-path/bitcoin-data:/root/.bitcoin"
    //   ]);
    // });

    // it("De-duplicate identical paths", () => {
    //   const volumeArray1 = ["ethchaindnpdappnodeeth_geth:/root/.ethereum/"];
    //   const volumeArray2 = ["ethchaindnpdappnodeeth_geth:/root/.ethereum"];

    //   const mergedPortMappings = mergeVolumeArrays(volumeArray1, volumeArray2);

    //   expect(mergedPortMappings).to.deep.equal([
    //     "ethchaindnpdappnodeeth_geth:/root/.ethereum"
    //   ]);
    // });

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
            volumes: ["/dev1/custom-path:/usr/data", "more_data:/usr/data2"],
            labels: {
              "dappnode.dnp.default.environment": "[]",
              "dappnode.dnp.default.ports": "[]",
              "dappnode.dnp.default.volumes": `["${bitcoinDataVolumeName}:/usr/data", "more_data:/usr/data2"]`
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
        namedVolumePaths: {
          [bitcoinDataVolumeName]: "/dev1/custom-path"
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
            volumes: [
              "/dev1/custom-path:/root/.bitcoin",
              "more_data:/usr/data2"
            ]
          }
        }
      };

      const userSettings = parseUserSetFromCompose(compose);

      const expectedUserSet: UserSettings = {
        environment: {},
        portMappings: {},
        namedVolumePaths: {
          [bitcoinDataVolumeName]: "/dev1/custom-path"
        }
      };

      expect(userSettings).to.deep.equal(expectedUserSet);
    });
  });

  describe("applyUserSet", () => {
    it("Should apply some user settings", () => {
      const environment = ["ORIGINAL=VALUE", "USERSET=VALUE"];
      const ports = ["4001:4001", "9090:9090/udp", "32764:6000"];
      const volumes = [
        `${bitcoinDataVolumeName}:/usr/data`,
        "/dev1/custom-path:/usr/data2"
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
        }
      };

      const userSet: UserSettings = {
        environment: {
          USERSET: "NEW_VALUE"
        },
        namedVolumePaths: {
          [bitcoinDataVolumeName]: "/dev0/user-set-path"
        },
        portMappings: {
          "4001/TCP": "4111",
          "9090/UDP": ""
        }
      };

      const expectedServiceParts = {
        environment: ["ORIGINAL=VALUE", "USERSET=NEW_VALUE"],
        ports: ["4111:4001", "9090/udp", "32764:6000"],
        volumes: [
          "/dev0/user-set-path:/usr/data",
          "/dev1/custom-path:/usr/data2"
        ]
      };
      const composeReturn = applyUserSet(compose, userSet);
      const serviceParts = pick(composeReturn.services[mockDnpName], [
        "environment",
        "ports",
        "volumes"
      ]);

      expect(serviceParts).to.deep.equal(expectedServiceParts);
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

  // describe("convertUserSetLegacy", () => {
  //   it("Should convert legacy userSet* types to userSet", () => {
  //     const dnpName = "kovan.dnp.dappnode.eth";
  //     const dnpName2 = "dependency.dnp.dappnode.eth";
  //     const userSetEnvs = {
  //       [dnpName]: {
  //         ENV_NAME: "CUSTOM_VALUE"
  //       }
  //     };
  //     const userSetVols = {
  //       [dnpName]: {
  //         "kovan:/root/.local/share/io.parity.ethereum/":
  //           "/dev1/custom-path:/root/.local/share/io.parity.ethereum/"
  //       }
  //     };
  //     const userSetPorts = {
  //       [dnpName]: {
  //         "30303": "31313:30303",
  //         "30303/udp": "31313:30303/udp"
  //       },
  //       [dnpName2]: {
  //         "4001:4001": "4001"
  //       }
  //     };

  //     const expectedUserSet: UserSettingsAllDnps = {
  //       [dnpName]: {
  //         environment: {
  //           ENV_NAME: "CUSTOM_VALUE"
  //         },
  //         namedVolumePaths: {
  //           "/root/.local/share/io.parity.ethereum": "/dev1/custom-path"
  //         },
  //         portMappings: {
  //           "30303/TCP": "31313",
  //           "30303/UDP": "31313"
  //         }
  //       },
  //       [dnpName2]: {
  //         environment: {},
  //         namedVolumePaths: {},
  //         portMappings: {
  //           "4001/TCP": ""
  //         }
  //       }
  //     };

  //     const userSet = mapValues()

  //     convertUserSetLegacy({
  //       userSetEnvs,
  //       userSetVols,
  //       userSetPorts
  //     });
  //     expect(userSet).to.deep.equal(expectedUserSet);
  //   });
  // });

  // describe("Merge userSet to the compose (applyUserSet, convertUserSetLegacy)", () => {
  //   it("should merge the userSetDnpObjects", () => {
  //     const serviceName = parseServiceName(mockCompose);

  //     const compose: Compose = {
  //       ...mockCompose,
  //       services: {
  //         [serviceName]: {
  //           ...mockCompose.services[serviceName],
  //           environment: ["ENV1=DEFAULTVAL1", "ENV2=DEFAULTVAL2"],
  //           ports: ["30303", "30303/udp", "30304:30304", "8080:8080"],
  //           volumes: [
  //             "kovan:/root/.local/share/io.parity.ethereum/",
  //             "sync-data:/root/.sync"
  //           ]
  //         }
  //       }
  //     };

  //     // Data introduced by the user at the moment of installing
  //     // [NOTE]: the user should be seeing a merge of [default + previous]
  //     const userSetDnpEnvs = {
  //       ENV1: "USER_SET_VAL1",
  //       ENV_OLD: "PREVIOUS_SET_VAL2"
  //     };
  //     const userSetDnpPorts = {
  //       "30303": "31313:30303",
  //       "30303/udp": "31313:30303/udp",
  //       "30304:30304": "30304"
  //     };
  //     const userSetDnpVols = {
  //       "kovan:/root/.local/share/io.parity.ethereum//":
  //         "different_path:/root/.local/share/io.parity.ethereum//",
  //       "old_version_volume:/original/path":
  //         "another_different_path:/original/path"
  //     };

  //     const userSet = convertUserSetLegacy({
  //       userSetEnvs: { [serviceName]: userSetDnpEnvs },
  //       userSetVols: { [serviceName]: userSetDnpVols },
  //       userSetPorts: { [serviceName]: userSetDnpPorts }
  //     });

  //     expect(userSet).to.deep.equal(
  //       {
  //         "mock-dnp.dnp.dappnode.eth": {
  //           environment: {
  //             ENV1: "USER_SET_VAL1",
  //             ENV_OLD: "PREVIOUS_SET_VAL2"
  //           },
  //           namedVolumeMappings: {
  //             "/original/path": "another_different_path",
  //             "/root/.local/share/io.parity.ethereum": "different_path"
  //           },
  //           portMappings: {
  //             "30303/TCP": "31313",
  //             "30303/UDP": "31313",
  //             "30304/TCP": ""
  //           }
  //         }
  //       },
  //       "Wrong userSet conversion"
  //     );

  //     const returnCompose = applyUserSet(compose, userSet[serviceName]);

  //     expect(
  //       pick(parseService(returnCompose), ["environment", "ports", "volumes"])
  //     ).to.deep.equal(
  //       {
  //         environment: ["ENV1=USER_SET_VAL1", "ENV2=DEFAULTVAL2"],
  //         ports: ["31313:30303", "31313:30303/udp", "30304", "8080:8080"],
  //         volumes: [
  //           "different_path:/root/.local/share/io.parity.ethereum",
  //           "sync-data:/root/.sync"
  //         ]
  //       },
  //       "Wrong applyUserSet result"
  //     );
  //   });
  // });
});
