import "mocha";
import { expect } from "chai";
import { PackageContainer, PortProtocol, Manifest } from "@dappnode/types";
import { mockContainer } from "../testUtils.js";
import { getPortsToOpen } from "../../src/natRenewal/getPortsToOpen.js";
import fs from "fs";
import path from "path";
import os from "os";
import { ComposeEditor } from "@dappnode/dockercompose";
import { params } from "@dappnode/params";
import { getManifestPath } from "@dappnode/utils";

describe("daemons > natRenewal > getPortsToOpen", () => {
  let testDir: string;
  const originalRepoDir = params.REPO_DIR;
  const originalCoreDir = params.DNCORE_DIR;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "nat-renewal-"));
    params.REPO_DIR = path.join(testDir, "dnp_repo");
    params.DNCORE_DIR = path.join(testDir, "DNCORE");
  });

  afterEach(() => {
    params.REPO_DIR = originalRepoDir;
    params.DNCORE_DIR = originalCoreDir;
    fs.rmSync(testDir, { recursive: true, force: true });
  });

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
        serviceName: stoppedDnp,
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
      },
      // From "stopped.dnp.dappnode.eth"
      {
        dnpName: stoppedDnp,
        protocol: "UDP",
        portNumber: 4001,
        serviceName: stoppedDnp
      },
      {
        dnpName: stoppedDnp,
        protocol: "TCP",
        portNumber: 4001,
        serviceName: stoppedDnp
      }
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
    function createTestManifest(dnpName: string, manifest: Manifest): void {
      const manifestPath = getManifestPath(dnpName, manifest.type === "dncore");
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
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

    it("Filters host ports for both protocols across services without affecting other packages", () => {
      const dnpName = "multi-service.dnp.dappnode.eth";
      createTestManifest(dnpName, {
        name: dnpName,
        version: "1.0.0",
        description: "Test package",
        type: "service",
        license: "MIT",
        upnpDisable: [30303]
      });

      const containers: PackageContainer[] = [
        {
          ...mockContainer,
          dnpName,
          serviceName: "first",
          ports: [
            { container: 9000, host: 30303, protocol: PortProtocol.TCP },
            { container: 30303, host: 8545, protocol: PortProtocol.TCP }
          ]
        },
        {
          ...mockContainer,
          dnpName,
          serviceName: "second",
          ports: [{ container: 9000, host: 30303, protocol: PortProtocol.UDP }]
        },
        {
          ...mockContainer,
          ports: [
            { container: 30303, host: 30303, protocol: PortProtocol.TCP },
            { container: 9000, protocol: PortProtocol.TCP }
          ]
        }
      ];

      expect(getPortsToOpen(containers)).to.deep.equal([
        { dnpName, serviceName: "first", portNumber: 8545, protocol: PortProtocol.TCP },
        {
          dnpName: mockContainer.dnpName,
          serviceName: mockContainer.serviceName,
          portNumber: 30303,
          protocol: PortProtocol.TCP
        }
      ]);
    });

    const stoppedConfigurations: (true | number[])[] = [true, [8545], []];
    for (const upnpDisable of stoppedConfigurations) {
      it(`Filters stopped container ports with upnpDisable ${JSON.stringify(upnpDisable)}`, () => {
        const dnpName = "stopped-upnp.dnp.dappnode.eth";
        createTestManifest(dnpName, {
          name: dnpName,
          version: "1.0.0",
          description: "Test package",
          type: "service",
          license: "MIT",
          upnpDisable
        });
        const compose = new ComposeEditor({ services: { service: { image: dnpName } } });
        compose.services().service.setPortMapping([
          { container: 8545, host: 8545, protocol: PortProtocol.TCP },
          { container: 30303, host: 30303, protocol: PortProtocol.UDP }
        ]);
        compose.writeTo(ComposeEditor.getComposePath(dnpName, false));

        const ports = getPortsToOpen([{ ...mockContainer, dnpName, serviceName: "service", running: false }]);
        const expectedPorts = upnpDisable === true ? [] : upnpDisable.length ? [30303] : [8545, 30303];
        expect(ports.map((port) => port.portNumber)).to.deep.equal(expectedPorts);
      });
    }

    it("Reads UPnP exclusions from core package manifests", () => {
      const dnpName = params.vpnDnpName;
      createTestManifest(dnpName, {
        name: dnpName,
        version: "1.0.0",
        description: "Test core package",
        type: "dncore",
        license: "MIT",
        upnpDisable: true
      });

      expect(
        getPortsToOpen([
          {
            ...mockContainer,
            dnpName,
            isCore: true,
            ports: [{ container: 1194, host: 1194, protocol: PortProtocol.UDP }]
          }
        ])
      ).to.deep.equal([]);
    });

    it("Continues with other packages when a manifest cannot be parsed", () => {
      const dnpName = "invalid-manifest.dnp.dappnode.eth";
      const manifestPath = getManifestPath(dnpName, false);
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, "upnpDisable: [");

      expect(
        getPortsToOpen([
          { ...mockContainer, dnpName, ports: [{ container: 8545, host: 8545, protocol: PortProtocol.TCP }] },
          { ...mockContainer, ports: [{ container: 30303, host: 30303, protocol: PortProtocol.UDP }] }
        ])
      ).to.deep.equal([
        {
          dnpName: mockContainer.dnpName,
          serviceName: mockContainer.serviceName,
          portNumber: 30303,
          protocol: PortProtocol.UDP
        }
      ]);
    });
  });
});
