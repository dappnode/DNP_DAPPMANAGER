import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import params from "../../src/params";
import { createTestDir, cleanTestDir, mockDnp } from "../testUtils";
import { PortMapping, PackageContainer } from "../../src/types";
import rewiremock from "rewiremock";
// Import dependencies for typing
import lockPorts from "../../src/modules/lockPorts";

describe("Module: lockPorts", () => {
  const normalDnpName = "kovan.dnp.dappnode.eth";
  const normalDnpPorts = ["30303", "30303/udp"];

  const coreDnpName = "ethchain.dnp.dappnode.eth";
  const coreDnpPorts = ["30303", "30303/udp"];

  const noPortsDnpName = "ipfs.dnp.dappnode.eth";
  const noPortsPorts = ["4001:4001", "4002:4002/udp"];

  const ephemeralPort: { tcp: number; udp: number } = {
    tcp: 32768 - 1,
    udp: 32768 - 1
  };
  function getListContainerPorts(ports: string[]): PortMapping[] {
    return ports
      .filter(port => !port.includes(":"))
      .map(port => {
        const [portNumber, portType] = port.split("/");
        if (portType === "udp") ephemeralPort.udp++;
        else ephemeralPort.tcp++;
        return {
          ip: "0.0.0.0",
          container: parseInt(portNumber),
          host: portType === "udp" ? ephemeralPort.udp : ephemeralPort.tcp,
          protocol: portType === "udp" ? "UDP" : "TCP"
        };
      });
  }

  async function listContainer(byName: string): Promise<PackageContainer> {
    if (byName === normalDnpName)
      return {
        ...mockDnp,
        name: normalDnpName,
        ports: getListContainerPorts(normalDnpPorts)
      };
    if (byName === coreDnpName)
      return {
        ...mockDnp,
        name: coreDnpName,
        isCore: true,
        ports: getListContainerPorts(coreDnpPorts)
      };
    if (byName === noPortsDnpName)
      return {
        ...mockDnp,
        name: noPortsDnpName,
        ports: getListContainerPorts(noPortsPorts)
      };
    throw Error(`MOCK ERROR - unknown DNP for ${byName}`);
  }

  async function dockerComposeUp(dcPath: string): Promise<string> {
    dcPath;
    return "success";
  }

  let lockPortsMock: typeof lockPorts;

  beforeEach("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../src/modules/lockPorts"),
      mock => {
        mock(() => import("../../src/modules/docker/listContainers"))
          .with({ listContainer })
          .toBeUsed();
        mock(() => import("../../src/modules/docker/dockerCommands"))
          .with({ dockerComposeUp })
          .toBeUsed();
      }
    );
    lockPortsMock = mock.default;
  });

  before(async () => {
    await createTestDir();

    for (const { name, composeString, isCore } of [
      {
        name: normalDnpName,
        composeString: `version: '3.4'
services:
  ${normalDnpName}:
    ports:
      - '30303/udp'
      - '30303'`,
        isCore: false
      },
      {
        name: coreDnpName,
        composeString: `version: '3.4'
services:
  ${coreDnpName}:
    ports:
      - '30303/udp'
      - '30303'`,
        isCore: true
      },
      {
        name: noPortsDnpName,
        composeString: `version: '3.4'
services:
  ${noPortsDnpName}:
    ports:
      - '4001:4001'
      - '4002:4002/udp'`,
        isCore: false
      }
    ]) {
      const composePath = getPath.dockerCompose(name, params, isCore);
      validate.path(composePath);
      fs.writeFileSync(composePath, composeString);
    }
  });

  it("should lock ports and return portsToOpen (NON core)", async () => {
    const portsToOpen = await lockPortsMock(normalDnpName);
    const expectedPortsToOpen: PortMapping[] = [
      { host: 32768, container: 30303, protocol: "UDP" },
      { host: 32768, container: 30303, protocol: "TCP" }
    ];
    expect(portsToOpen).to.deep.equal(
      expectedPortsToOpen,
      "Wrong returned ports"
    );

    const dc = fs.readFileSync(
      getPath.dockerCompose(normalDnpName, params, false),
      "utf8"
    );
    expect(dc).to.equal(
      `version: '3.4'
services:
  ${normalDnpName}:
    ports:
      - '32768:30303'
      - '32768:30303/udp'
`,
      "Wrong modified docker-compose"
    );
  });

  it("should lock ports and return portsToOpen (core)", async () => {
    const portsToOpen = await lockPortsMock(coreDnpName);
    const expectedPortsToOpen: PortMapping[] = [
      { host: 32769, container: 30303, protocol: "UDP" },
      { host: 32769, container: 30303, protocol: "TCP" }
    ];
    expect(portsToOpen).to.deep.equal(
      expectedPortsToOpen,
      "Wrong returned ports"
    );

    const dc = fs.readFileSync(
      getPath.dockerCompose(coreDnpName, params, true),
      "utf8"
    );
    expect(dc).to.equal(
      `version: '3.4'
services:
  ${coreDnpName}:
    ports:
      - '32769:30303'
      - '32769:30303/udp'
`,
      "Wrong modified docker-compose"
    );
  });

  it("should skip the process early on a package without ephemeral ports", async () => {
    const earlyReturn = await lockPortsMock(noPortsDnpName);
    expect(earlyReturn).to.deep.equal([] as PortMapping[]);
  });

  after(async () => {
    await cleanTestDir();
  });
});
