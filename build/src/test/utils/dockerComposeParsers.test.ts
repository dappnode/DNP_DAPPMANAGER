import "mocha";
import { expect } from "chai";
import { PortProtocol, VolumeMapping } from "../../src/types";

import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings,
  parseEnvironment,
  stringifyEnvironment,
  mergePortArrays,
  parseVolumeMappings,
  stringifyVolumeMappings,
  mergeVolumeMappings,
  mergeVolumeArrays
} from "../../src/utils/dockerComposeParsers";

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

    it("should merge volume mappings", () => {
      const volumeMappings1: VolumeMapping[] = [
        { host: "/dev1/custom-path/bitcoin-data", container: "/root/.bitcoin" }
      ];

      const volumeMappings2: VolumeMapping[] = [
        { host: "bitcoin_data", container: "/root/.bitcoin" },
        { host: "/etc/another-path", container: "/etc/some-path" }
      ];

      const mergedVolumeMappings = mergeVolumeMappings(
        volumeMappings1,
        volumeMappings2
      );

      expect(mergedVolumeMappings).to.deep.equal([
        { host: "/dev1/custom-path/bitcoin-data", container: "/root/.bitcoin" },
        { host: "/etc/another-path", container: "/etc/some-path" }
      ]);
    });

    it("should parse, merge and stringify two volume arrays", () => {
      const volumeArray1 = ["/dev1/custom-path/bitcoin-data:/root/.bitcoin"];
      const volumeArray2 = ["bitcoin_data:/root/.bitcoin"];

      const mergedPortMappings = mergeVolumeArrays(volumeArray1, volumeArray2);

      expect(mergedPortMappings).to.deep.equal([
        "/dev1/custom-path/bitcoin-data:/root/.bitcoin"
      ]);
    });
  });
});
