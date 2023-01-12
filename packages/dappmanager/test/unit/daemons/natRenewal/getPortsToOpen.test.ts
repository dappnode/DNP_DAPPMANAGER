import "mocha";
import { expect } from "chai";
import { PackageContainer, PortProtocol } from "@dappnode/common";
// imports for typings
import { mockContainer } from "../../../testUtils";
import { ComposeEditor } from "../../../../src/modules/compose/editor";
import getPortsToOpen from "../../../../src/daemons/natRenewal/getPortsToOpen";

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
});
