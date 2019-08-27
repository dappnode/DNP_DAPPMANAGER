const expect = require("chai").expect;

const appendIsPortDeletable = require("utils/appendIsPortDeletable");

// module.exports = {
//     load: loadEnvs,
//     write: writeEnvs,
//     getManifestEnvs,
//   };

describe("Util: appendIsPortDeletable", () => {
  it("should flag deletable for a normal case (Swarm)", () => {
    const manifest = {
      name: "swarm.dnp.dappnode.eth",
      image: {
        ports: ["30399:30399", "30399:30399/udp"]
      }
    };

    const portMappings = [
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
    const manifest = {
      name: "ethforward.dnp.dappnode.eth",
      image: {}
    };

    const portMappings = [
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
