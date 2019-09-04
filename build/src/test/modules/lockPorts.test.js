const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");
const params = require("params");
const { createTestDir, cleanTestDir } = require("../testUtils");

describe("Module: lockPorts", function() {
  const normalDnpName = "kovan.dnp.dappnode.eth";
  const normalDnpPorts = ["30303", "30303/udp"];

  const coreDnpName = "ethchain.dnp.dappnode.eth";
  const coreDnpPorts = ["30303", "30303/udp"];

  const noPortsDnpName = "ipfs.dnp.dappnode.eth";
  const noPortsPorts = ["4001:4001", "4002:4002/udp"];

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
          ip: "0.0.0.0",
          container: portNumber,
          host: ephemeralPort[portType]++,
          protocol: portType
        };
      });
  }

  const dockerList = {
    getContainer: async id => {
      if (id === normalDnpName)
        return {
          name: normalDnpName,
          ports: getListContainerPorts(normalDnpPorts)
        };
      if (id === coreDnpName)
        return {
          name: coreDnpName,
          isCore: true,
          ports: getListContainerPorts(coreDnpPorts)
        };
      if (id === noPortsDnpName)
        return {
          name: noPortsDnpName,
          ports: getListContainerPorts(noPortsPorts)
        };
    }
  };

  const docker = {
    compose: {
      up: async () => {}
    }
  };

  const lockPorts = proxyquire("modules/lockPorts", {
    "modules/dockerList": dockerList,
    "modules/docker": docker
  });

  before(async () => {
    await createTestDir();

    for (const [name, composeString, isCore] of [
      [
        normalDnpName,
        `version: '3.4'
services:
  ${normalDnpName}:
    ports:
      - '30303/udp'
      - '30303'`
      ],
      [
        coreDnpName,
        `version: '3.4'
services:
  ${coreDnpName}:
    ports:
      - '30303/udp'
      - '30303'`,
        true
      ],
      [
        noPortsDnpName,
        `version: '3.4'
services:
  ${noPortsDnpName}:
    ports:
      - '4001:4001'
      - '4002:4002/udp'`
      ]
    ]) {
      const composePath = getPath.dockerCompose(name, params, isCore);
      validate.path(composePath);
      fs.writeFileSync(composePath, composeString);
    }
  });

  it("should lock ports and return portsToOpen (NON core)", async () => {
    const portsToOpen = await lockPorts(normalDnpName);
    expect(portsToOpen).to.deep.equal([
      { host: "32768", container: "30303", protocol: "UDP" },
      { host: "32768", container: "30303", protocol: "TCP" }
    ]);
  });

  it("should have modified the docker-compose (NON core)", async () => {
    const dc = fs.readFileSync(
      getPath.dockerCompose(normalDnpName, params),
      "utf8"
    );
    expect(dc).to.equal(`version: '3.4'
services:
  ${normalDnpName}:
    ports:
      - '32768:30303'
      - '32768:30303/udp'
`);
  });

  it("should lock ports and return portsToOpen (core)", async () => {
    const portsToOpen = await lockPorts(coreDnpName);
    expect(portsToOpen).to.deep.equal([
      { host: "32769", container: "30303", protocol: "UDP" },
      { host: "32769", container: "30303", protocol: "TCP" }
    ]);
  });

  it("should have modified the docker-compose (core)", async () => {
    const dc = fs.readFileSync(
      getPath.dockerCompose(coreDnpName, params, true),
      "utf8"
    );
    expect(dc).to.equal(`version: '3.4'
services:
  ${coreDnpName}:
    ports:
      - '32769:30303'
      - '32769:30303/udp'
`);
  });

  it("should skip the process early on a package without ephemeral ports", async () => {
    const earlyReturn = await lockPorts(noPortsDnpName);
    expect(earlyReturn).to.equal(undefined);
  });

  after(async () => {
    await cleanTestDir();
  });
});
