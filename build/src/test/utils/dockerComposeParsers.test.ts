import "mocha";
import { expect } from "chai";
import { PortProtocol } from "../../src/types";

import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings,
  parseEnvironment,
  stringifyEnvironment
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
        { container: 4001, protocol: "TCP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30303, container: 30303, protocol: "UDP" as PortProtocol },
        { host: 60606, container: 60606, protocol: "TCP" as PortProtocol }
      ];

      const portMappings2 = [
        { container: 5001, protocol: "UDP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "UDP" as PortProtocol },
        { container: 60606, protocol: "TCP" as PortProtocol }
      ];

      const mergedPortMappings = mergePortMappings(
        portMappings1,
        portMappings2
      );

      expect(mergedPortMappings).to.deep.equal([
        { container: 4001, protocol: "TCP" as PortProtocol },
        { container: 5001, protocol: "UDP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "TCP" as PortProtocol },
        { host: 30304, container: 30303, protocol: "UDP" as PortProtocol },
        { container: 60606, protocol: "TCP" as PortProtocol }
      ]);
    });

    it("should parse, merge and stringify two port arrays", () => {
      const portArray1 = ["4001:4001", "30303:30303/udp"];
      // Change the host of a port and add another one.
      const portArray2 = ["30656:30303/udp", "8080:8080"];

      const mergedPortMappings = stringifyPortMappings(
        mergePortMappings(
          parsePortMappings(portArray1),
          parsePortMappings(portArray2)
        )
      );

      expect(mergedPortMappings).to.deep.equal([
        "4001:4001",
        "8080:8080",
        "30656:30303/udp"
      ]);
    });
  });
});
