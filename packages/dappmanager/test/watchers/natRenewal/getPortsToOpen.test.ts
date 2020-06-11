import "mocha";
import { expect } from "chai";
import defaultPortsToOpen from "../../../src/watchers/natRenewal/defaultPortsToOpen";
import { PortMapping, PackageContainer } from "../../../src/types";
import rewiremock from "rewiremock";
// imports for typings
import { mockDnp } from "../../testUtils";

describe("Watchers > natRenewal > getPortsToOpen", () => {
  it("Return portsToOpen on a normal case", async () => {
    const stoppedDnp = "stopped.dnp.dappnode.eth";
    const dnpList: PackageContainer[] = [
      {
        ...mockDnp,
        isCore: true,
        name: "admin.dnp.dappnode.eth",
        ports: [{ container: 80, host: 8090, protocol: "TCP" }],
        running: true
      },
      {
        ...mockDnp,
        isCore: true,
        name: "vpn.dnp.dappnode.eth",
        ports: [{ container: 1194, host: 1194, protocol: "UDP" }],
        running: true
      },
      {
        ...mockDnp,
        isCore: true,
        name: "vpn.dnp.dappnode.eth2",
        ports: [{ container: 1194, host: 1194, protocol: "UDP" }],
        running: true
      },
      {
        ...mockDnp,
        isCore: false,
        name: "goerli.dnp.dappnode.eth",
        ports: [
          { container: 30303, host: 32769, protocol: "TCP" },
          { container: 30303, host: 32771, protocol: "UDP" },
          { container: 30304, host: 32770, protocol: "UDP" }
        ],
        running: true
      },
      {
        ...mockDnp,
        isCore: false,
        name: stoppedDnp,
        running: false
      }
    ];

    async function listContainers(): Promise<PackageContainer[]> {
      return dnpList;
    }

    function getPortMappings(dnpName: string): PortMapping[] {
      if (dnpName.includes(stoppedDnp))
        return [
          { host: 4001, container: 4001, protocol: "UDP" },
          { host: 4001, container: 4001, protocol: "TCP" }
        ];
      else throw Error(`Unknown dnpName "${dnpName}"`);
    }

    const { default: getPortsToOpen } = await rewiremock.around(
      () => import("../../../src/watchers/natRenewal/getPortsToOpen"),
      mock => {
        mock(() => import("../../../src/modules/docker/listContainers"))
          .with({ listContainers })
          .toBeUsed();
        mock(() => import("../../../src/utils/dockerComposeFile"))
          .with({ getPortMappings })
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
        mock(() => import("../../../src/modules/docker/listContainers"))
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
          ...mockDnp,
          isCore: true,
          name: "admin.dnp.dappnode.eth",
          ports: [{ container: 80, host: 8090, protocol: "TCP" }],
          running: true
        },
        {
          ...mockDnp,
          name: throwsDnp,
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
        mock(() => import("../../../src/modules/docker/listContainers"))
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
