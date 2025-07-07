import "mocha";
import { expect } from "chai";
import { PackageContainer, PortProtocol, Manifest } from "@dappnode/types";
import { mockContainer } from "../testUtils.js";
import { getPortsToOpen } from "../../src/natRenewal/getPortsToOpen.js";
import fs from "fs";
import path from "path";
import { ComposeEditor } from "@dappnode/dockercompose";

describe("daemons > natRenewal > getPortsToOpen", () => {
  it("Return portsToOpen on a normal case", async () => {
    const stoppedDnp = "stopped.dnp.dappnode.eth";
    const containers: PackageContainer[] = [
      {
        ...mockContainer,
        isCore: true,
        dnpName: "admin.dnp.dappnode.eth",
        ports: [{ container: 80, host: 8090, protocol: PortProtocol.TCP }],
        running: true
      },
      {
        ...mockContainer,
        isCore: true,
        dnpName: "vpn.dnp.dappnode.eth",
        ports: [{ container: 1194, host: 1194, protocol: PortProtocol.UDP }],
        running: true
      },
      {
        ...mockContainer,
        isCore: true,
        dnpName: "vpn.dnp.dappnode.eth2",
        ports: [{ container: 1194, host: 1194, protocol: PortProtocol.UDP }],
        running: true
      },
      {
        ...mockContainer,
        isCore: false,
        dnpName: "goerli.dnp.dappnode.eth",
        ports: [
          { container: 30303, host: 32769, protocol: PortProtocol.TCP },
          { container: 30303, host: 32771, protocol: PortProtocol.UDP },
          { container: 30304, host: 32770, protocol: PortProtocol.UDP }
        ],
        running: true
      },
      {
        ...mockContainer,
        isCore: false,
        dnpName: stoppedDnp,
        running: false
      }
    ];

    async function listContainers(): Promise<PackageContainer[]> {
      return containers;
    }

    // Write the compose of the stopped container
    const compose = new ComposeEditor({
      version: "3.5",
      services: {
        [stoppedDnp]: {
          container_name: stoppedDnp,
          image: stoppedDnp
        }
      }
    });
    compose.services()[stoppedDnp].setPortMapping([
      { host: 4001, container: 4001, protocol: PortProtocol.UDP },
      { host: 4001, container: 4001, protocol: PortProtocol.TCP }
    ]);
    compose.writeTo(ComposeEditor.getComposePath(stoppedDnp, false));

    const containersListed = await listContainers();
    const portsToOpen = getPortsToOpen(containersListed);

    expect(portsToOpen).to.deep.equal([
      // From "admin.dnp.dappnode.eth"
      {
        dnpName: "admin.dnp.dappnode.eth",
        protocol: "TCP",
        portNumber: 8090,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      },
      // From  "vpn.dnp.dappnode.eth"
      {
        dnpName: "vpn.dnp.dappnode.eth2",
        protocol: "UDP",
        portNumber: 1194,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      },
      // From "goerli.dnp.dappnode.eth"

      {
        dnpName: "goerli.dnp.dappnode.eth",
        protocol: "TCP",
        portNumber: 32769,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      },
      {
        dnpName: "goerli.dnp.dappnode.eth",
        protocol: "UDP",
        portNumber: 32771,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      },
      {
        dnpName: "goerli.dnp.dappnode.eth",
        protocol: "UDP",
        portNumber: 32770,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      }
      // From "stopped.dnp.dappnode.eth"
    ]);
  });

  it("Ignore a DNP if it throws fetching it's docker-compose", async () => {
    const throwsDnp = "throws.dnp.dappnode.eth";

    async function listContainers(): Promise<PackageContainer[]> {
      return [
        {
          ...mockContainer,
          isCore: true,
          dnpName: "admin.dnp.dappnode.eth",
          ports: [{ container: 80, host: 8090, protocol: PortProtocol.TCP }],
          running: true
        },
        {
          ...mockContainer,
          dnpName: throwsDnp,
          running: false
        }
      ];
    }

    // "../../utils/parse": {
    //   dockerComposePorts: (dockerComposePath: string): void => {
    //     if (
    //       dockerComposePath === `dnp_repo/${throwsDnp}/docker-compose.yml`
    //     )
    //       throw Error(`Demo Error for ${throwsDnp}`);
    //     else
    //       throw Error(`Unknown dockerComposePath "${dockerComposePath}"`);
    //   }
    // }

    const containers = await listContainers();
    const portsToOpen = getPortsToOpen(containers);
    expect(portsToOpen).to.deep.equal([
      // Should return only the admin's ports and ignore the other DNP's
      // From "admin.dnp.dappnode.eth"
      {
        dnpName: "admin.dnp.dappnode.eth",
        protocol: "TCP",
        portNumber: 8090,
        serviceName: "mock-dnp.dnp.dappnode.eth"
      }
    ]);
  });

  describe("upnpDisable functionality", () => {
    beforeEach(() => {
      try {
        if (fs.existsSync("./dnp_repo")) {
          fs.rmSync("./dnp_repo", { recursive: true, force: true });
        }
      } catch (e) {
      }
    });

    afterEach(() => {
      try {
        if (fs.existsSync("./dnp_repo")) {
          fs.rmSync("./dnp_repo", { recursive: true, force: true });
        }
      } catch (e) {
      }
    });

    function createTestManifest(dnpName: string, manifest: Manifest): void {
      const dnpDir = path.join("./dnp_repo", dnpName);
      if (!fs.existsSync(dnpDir)) {
        fs.mkdirSync(dnpDir, { recursive: true });
      }
      const manifestPath = path.join(dnpDir, "dappnode_package.json");
      
      const dir = path.dirname(manifestPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    it("Should exclude all ports when upnpDisable is true", () => {
      const dnpName = "test-disable-all.dnp.dappnode.eth";
      const manifest: Manifest = {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT",
        upnpDisable: true
      };

      createTestManifest(dnpName, manifest);

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          isCore: false,
          dnpName,
          ports: [
            { container: 8545, host: 8545, protocol: PortProtocol.TCP },
            { container: 30303, host: 30303, protocol: PortProtocol.UDP }
          ],
          running: true
        }
      ];

      const portsToOpen = getPortsToOpen(containers);
      expect(portsToOpen).to.deep.equal([]);
    });

    it("Should exclude specific ports when upnpDisable is an array", () => {
      const dnpName = "test-disable-specific.dnp.dappnode.eth";
      const manifest: Manifest = {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT",
        upnpDisable: [8545] // Only disable port 8545
      };

      createTestManifest(dnpName, manifest);

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          isCore: false,
          dnpName,
          ports: [
            { container: 8545, host: 8545, protocol: PortProtocol.TCP }, // Should be excluded
            { container: 30303, host: 30303, protocol: PortProtocol.UDP } // Should be included
          ],
          running: true
        }
      ];

      const portsToOpen = getPortsToOpen(containers);
      expect(portsToOpen).to.deep.equal([
        {
          dnpName,
          protocol: "UDP",
          portNumber: 30303,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        }
      ]);
    });

    it("Should include all ports when upnpDisable is false", () => {
      const dnpName = "test-upnp-enabled.dnp.dappnode.eth";
      const manifest: Manifest = {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT",
        upnpDisable: false
      };

      createTestManifest(dnpName, manifest);

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          isCore: false,
          dnpName,
          ports: [
            { container: 8545, host: 8545, protocol: PortProtocol.TCP },
            { container: 30303, host: 30303, protocol: PortProtocol.UDP }
          ],
          running: true
        }
      ];

      const portsToOpen = getPortsToOpen(containers);
      expect(portsToOpen).to.deep.equal([
        {
          dnpName,
          protocol: "TCP",
          portNumber: 8545,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        },
        {
          dnpName,
          protocol: "UDP",
          portNumber: 30303,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        }
      ]);
    });

    it("Should include all ports when upnpDisable is not defined", () => {
      const dnpName = "test-no-upnp-setting.dnp.dappnode.eth";
      const manifest: Manifest = {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT"
        // upnpDisable not defined
      };

      createTestManifest(dnpName, manifest);

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          isCore: false,
          dnpName,
          ports: [
            { container: 8545, host: 8545, protocol: PortProtocol.TCP },
            { container: 30303, host: 30303, protocol: PortProtocol.UDP }
          ],
          running: true
        }
      ];

      const portsToOpen = getPortsToOpen(containers);
      expect(portsToOpen).to.deep.equal([
        {
          dnpName,
          protocol: "TCP",
          portNumber: 8545,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        },
        {
          dnpName,
          protocol: "UDP",
          portNumber: 30303,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        }
      ]);
    });

    it("Should handle multiple ports in upnpDisable array", () => {
      const dnpName = "test-multiple-disabled.dnp.dappnode.eth";
      const manifest: Manifest = {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT",
        upnpDisable: [8545, 30303, 9000] // Disable multiple ports
      };

      createTestManifest(dnpName, manifest);

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          isCore: false,
          dnpName,
          ports: [
            { container: 8545, host: 8545, protocol: PortProtocol.TCP }, // Should be excluded
            { container: 30303, host: 30303, protocol: PortProtocol.UDP }, // Should be excluded
            { container: 9000, host: 9000, protocol: PortProtocol.TCP }, // Should be excluded
            { container: 3000, host: 3000, protocol: PortProtocol.TCP } // Should be included
          ],
          running: true
        }
      ];

      const portsToOpen = getPortsToOpen(containers);
      expect(portsToOpen).to.deep.equal([
        {
          dnpName,
          protocol: "TCP",
          portNumber: 3000,
          serviceName: "mock-dnp.dnp.dappnode.eth"
        }
      ]);
    });
  });
});
