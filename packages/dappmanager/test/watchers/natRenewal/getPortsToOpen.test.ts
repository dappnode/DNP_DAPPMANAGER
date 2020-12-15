import "mocha";
import { expect } from "chai";
import defaultPortsToOpen from "../../../src/watchers/natRenewal/defaultPortsToOpen";
import { PackageContainer } from "../../../src/types";
import rewiremock from "rewiremock";
// imports for typings
import { mockContainer } from "../../testUtils";
import { ComposeEditor } from "../../../src/modules/compose/editor";

describe("Watchers > natRenewal > getPortsToOpen", () => {
  it("Return portsToOpen on a normal case", async () => {
    const stoppedDnp = "stopped.dnp.dappnode.eth";
    const containers: PackageContainer[] = [
      {
        ...mockContainer,
        isCore: true,
        dnpName: "admin.dnp.dappnode.eth",
        ports: [{ container: 80, host: 8090, protocol: "TCP" }],
        running: true
      },
      {
        ...mockContainer,
        isCore: true,
        dnpName: "vpn.dnp.dappnode.eth",
        ports: [{ container: 1194, host: 1194, protocol: "UDP" }],
        running: true
      },
      {
        ...mockContainer,
        isCore: true,
        dnpName: "vpn.dnp.dappnode.eth2",
        ports: [{ container: 1194, host: 1194, protocol: "UDP" }],
        running: true
      },
      {
        ...mockContainer,
        isCore: false,
        dnpName: "goerli.dnp.dappnode.eth",
        ports: [
          { container: 30303, host: 32769, protocol: "TCP" },
          { container: 30303, host: 32771, protocol: "UDP" },
          { container: 30304, host: 32770, protocol: "UDP" }
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
      version: "3.4",
      services: {
        [stoppedDnp]: {
          container_name: stoppedDnp,
          image: stoppedDnp
        }
      }
    });
    compose.services()[stoppedDnp].setPortMapping([
      { host: 4001, container: 4001, protocol: "UDP" },
      { host: 4001, container: 4001, protocol: "TCP" }
    ]);
    compose.writeTo(ComposeEditor.getComposePath(stoppedDnp, false));

    const { default: getPortsToOpen } = await rewiremock.around(
      () => import("../../../src/watchers/natRenewal/getPortsToOpen"),
      mock => {
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listContainers })
          .toBeUsed();
      }
    );

    const portsToOpen = await getPortsToOpen();

    expect(portsToOpen).to.deep.equal([
      // From "admin.dnp.dappnode.eth"
      { protocol: "TCP", portNumber: 8090 },
      // From  "vpn.dnp.dappnode.eth"
      { protocol: "UDP", portNumber: 1194 },
      // From "goerli.dnp.dappnode.eth"
      { protocol: "TCP", portNumber: 32769 },
      { protocol: "UDP", portNumber: 32771 },
      { protocol: "UDP", portNumber: 32770 },
      // From "stopped.dnp.dappnode.eth"
      { protocol: "UDP", portNumber: 4001 },
      { protocol: "TCP", portNumber: 4001 }
    ]);
  });

  it("Return default ports if portsToOpen throws", async () => {
    async function listContainers(): Promise<PackageContainer[]> {
      throw Error("Demo Error for listContainers");
    }

    const { default: getPortsToOpen } = await rewiremock.around(
      () => import("../../../src/watchers/natRenewal/getPortsToOpen"),
      mock => {
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listContainers })
          .toBeUsed();
        // mock(() => import("../../../src/utils/dockerComposeFile"))
        //   .with({ getComposeInstance })
        //   .toBeUsed();
      }
    );

    const portsToOpen = await getPortsToOpen();
    expect(portsToOpen).to.deep.equal(defaultPortsToOpen);
  });

  it("Ignore a DNP if it throws fetching it's docker-compose", async () => {
    const throwsDnp = "throws.dnp.dappnode.eth";

    async function listContainers(): Promise<PackageContainer[]> {
      return [
        {
          ...mockContainer,
          isCore: true,
          dnpName: "admin.dnp.dappnode.eth",
          ports: [{ container: 80, host: 8090, protocol: "TCP" }],
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

    const { default: getPortsToOpen } = await rewiremock.around(
      () => import("../../../src/watchers/natRenewal/getPortsToOpen"),
      mock => {
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listContainers })
          .toBeUsed();
      }
    );

    const portsToOpen = await getPortsToOpen();
    expect(portsToOpen).to.deep.equal([
      // Should return only the admin's ports and ignore the other DNP's
      // From "admin.dnp.dappnode.eth"
      { protocol: "TCP", portNumber: 8090 }
    ]);
  });
});
