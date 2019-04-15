const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

describe("Module: lockPorts", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const pkg = {
    name: "kovan.dnp.dappnode.eth",
    ver: "0.1.0",
    manifest: {
      image: {
        ports: ["30303", "30303/udp"]
      },
      isCore: false
    }
  };
  const corePkg = {
    name: "ethchain.dnp.dappnode.eth",
    ver: "0.1.0",
    manifest: {
      image: {
        ports: ["30303", "30303/udp"]
      },
      isCore: false
    }
  };
  const nonPortsPkg = {
    name: "ipfs.dnp.dappnode.eth",
    ver: "0.1.0",
    manifest: {
      image: {
        ports: ["4001:4001", "4002:4002/udp"]
      }
    }
  };

  const dockerComposePath = getPath.dockerCompose(pkg.name, params);
  const coreDockerComposePath = getPath.dockerCompose(corePkg.name, params);

  let ephemeralPort = {
    tcp: 32768,
    udp: 32768
  };
  function getListContainerPorts(ports) {
    return ports
      .filter(port => !port.includes(":"))
      .map(port => {
        let [portNumber, portType = "tcp"] = port.split("/");
        return {
          IP: "0.0.0.0",
          PrivatePort: portNumber, // container port
          PublicPort: ephemeralPort[portType]++, // host port
          Type: portType
        };
      });
  }
  const listContainersResult = [
    {
      name: pkg.name,
      ports: getListContainerPorts(pkg.manifest.image.ports)
    },
    {
      name: corePkg.name,
      isCore: true,
      ports: getListContainerPorts(corePkg.manifest.image.ports)
    }
  ];
  const dockerList = {
    listContainers: async () => listContainersResult
  };
  const docker = {
    compose: {
      up: async () => {}
    }
  };

  const lockPorts = proxyquire("modules/lockPorts", {
    "modules/dockerList": dockerList,
    "modules/docker": docker,
    params: params
  });

  before(() => {
    validate.path(dockerComposePath);
    const dockerComposeString = `
version: '3.4'
services:
    ${pkg.name}:
        ports:
            - '30303/udp'
            - '30303'
`;
    fs.writeFileSync(dockerComposePath, dockerComposeString);
    validate.path(coreDockerComposePath);
    const coreDockerComposeString = `
version: '3.4'
services:
    ${corePkg.name}:
        ports:
            - '30303/udp'
            - '30303'
`;
    fs.writeFileSync(coreDockerComposePath, coreDockerComposeString);
  });

  it("should lock ports and return portsToOpen (NON core)", async () => {
    const portsToOpen = await lockPorts({ pkg });
    expect(portsToOpen).to.deep.equal([
      { number: 32768, type: "UDP" },
      { number: 32768, type: "TCP" }
    ]);
  });

  it("should have modified the docker-compose (NON core)", async () => {
    const dc = fs.readFileSync(dockerComposePath, "utf8");
    expect(dc).to.equal(`version: '3.4'
services:
    ${pkg.name}:
        ports:
            - '32768:30303/udp'
            - '32768:30303'
        labels:
            portsToClose: '[{"number":32768,"type":"UDP"},{"number":32768,"type":"TCP"}]'
`);
  });

  it("should lock ports and return portsToOpen (core)", async () => {
    const portsToOpen = await lockPorts({ pkg: corePkg });
    expect(portsToOpen).to.deep.equal([
      { number: 32769, type: "UDP" },
      { number: 32769, type: "TCP" }
    ]);
  });

  it("should have modified the docker-compose (core)", async () => {
    const dc = fs.readFileSync(coreDockerComposePath, "utf8");
    expect(dc).to.equal(`version: '3.4'
services:
    ${corePkg.name}:
        ports:
            - '32769:30303/udp'
            - '32769:30303'
        labels:
            portsToClose: '[{"number":32769,"type":"UDP"},{"number":32769,"type":"TCP"}]'
`);
  });

  it("should skip the process early on a package without ephemeral ports", async () => {
    const portsToOpen = await lockPorts({ pkg: nonPortsPkg });
    expect(portsToOpen).to.deep.equal([]);
  });

  after(() => {
    fs.unlinkSync(dockerComposePath);
    fs.unlinkSync(coreDockerComposePath);
  });
});
