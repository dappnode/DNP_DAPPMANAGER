import "mocha";
import { expect } from "chai";
import { ManifestInterface, PortMapping } from "../../src/types";
import { mockManifest } from "../testUtils";

import appendIsPortDeletable from "../../src/utils/appendIsPortDeletable";

describe("Util: appendIsPortDeletable", () => {
  it("should flag deletable for a normal case (Swarm)", () => {
    const manifest: ManifestInterface = {
      ...mockManifest,
      name: "swarm.dnp.dappnode.eth",
      image: {
        ...mockManifest.image,
        ports: ["30399:30399", "30399:30399/udp"]
      }
    };

    const portMappings: PortMapping[] = [
      {
        host: 30399,
        container: 30399,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0"
      },
      {
        host: 30399,
        container: 30399,
        protocol: "UDP",
        ephemeral: false,
        ip: "0.0.0.0"
      },
      {
        host: 8080,
        container: 8080,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0"
      }
    ];
    const newPortMappings = appendIsPortDeletable(portMappings, manifest);

    expect(newPortMappings).to.deep.equal([
      {
        host: 30399,
        container: 30399,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0",
        deletable: false
      },
      {
        host: 30399,
        container: 30399,
        protocol: "UDP",
        ephemeral: false,
        ip: "0.0.0.0",
        deletable: false
      },
      {
        host: 8080,
        container: 8080,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0",
        deletable: true
      }
    ]);
  });

  it("should flag deletable for a case without manifest ports (Ethforward)", () => {
    const manifest: ManifestInterface = {
      ...mockManifest,
      name: "ethforward.dnp.dappnode.eth",
      image: {
        ...mockManifest.image
      }
    };

    const portMappings: PortMapping[] = [
      {
        host: 80,
        container: 80,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0"
      }
    ];
    const newPortMappings = appendIsPortDeletable(portMappings, manifest);

    expect(newPortMappings).to.deep.equal([
      {
        host: 80,
        container: 80,
        protocol: "TCP",
        ephemeral: false,
        ip: "0.0.0.0",
        deletable: true
      }
    ]);
  });
});
