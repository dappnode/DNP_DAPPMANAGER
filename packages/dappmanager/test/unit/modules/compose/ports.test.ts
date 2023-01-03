import "mocha";
import { expect } from "chai";
import { PortProtocol } from "@dappnode/common";
import {
  parsePortMappings,
  stringifyPortMappings,
  mergePortMappings,
  mergePortArrays
} from "../../../../src/modules/compose";

describe("portMappings: parse, stringify and merge", () => {
  it("should parse and stringify port mappings", () => {
    const portArray = ["4001", "5001/udp", "30303:30303", "30303:30303/udp"];
    const portMappings = [
      { container: 4001, protocol: PortProtocol.TCP },
      { container: 5001, protocol: PortProtocol.UDP },
      { host: 30303, container: 30303, protocol: PortProtocol.TCP },
      { host: 30303, container: 30303, protocol: PortProtocol.UDP }
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
      { container: 5001, protocol: PortProtocol.UDP },
      { host: 30304, container: 30303, protocol: PortProtocol.TCP },
      { host: 30304, container: 30303, protocol: PortProtocol.UDP },
      { container: 60606, protocol: PortProtocol.TCP }
    ];

    const portMappings2 = [
      { container: 4001, protocol: PortProtocol.TCP },
      { host: 30303, container: 30303, protocol: PortProtocol.TCP },
      { host: 30303, container: 30303, protocol: PortProtocol.UDP },
      { host: 60606, container: 60606, protocol: PortProtocol.TCP }
    ];

    const mergedPortMappings = mergePortMappings(portMappings1, portMappings2);

    expect(mergedPortMappings).to.deep.equal([
      { container: 5001, protocol: PortProtocol.UDP },
      { host: 30304, container: 30303, protocol: PortProtocol.TCP },
      { host: 30304, container: 30303, protocol: PortProtocol.UDP },
      { container: 60606, protocol: PortProtocol.TCP },
      { container: 4001, protocol: PortProtocol.TCP }
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
