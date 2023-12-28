import "mocha";
import { expect } from "chai";
import {
  docker,
  dockerNetworkConnect,
  getNetworkAliasesMapNotThrow,
} from "@dappnode/dockerapi";
import { connectContainersToNetworkWithPrio } from "../../../src/migrateDockerNetworkIpRange/connectContainersToNetworkWithPrio/index.js";
import Dockerode from "dockerode";

describe("Ensure docker network config migration =>  connectContainersToNetworkWithPrio", () => {
  const networkName = "dncore_test";
  const dockerNetworkSubnet = "172.30.0.0/16";
  const dockerImageTest = "alpine";
  const dappmanagerContainerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  const dappmanagerIp = "172.30.0.7";
  const bindContainerName = "DAppNodeCore-bind.dnp.dappnode.eth";
  const bindIp = "172.30.0.2";
  const containerUsingDappmanagerIp =
    "DAppNodePackage-validator.web3signer.dnp.dappnode.eth";
  const containerUsingBindIp = "DAppNodePackage-rotki.dnp.dappnode.eth";

  const containerNames = [
    dappmanagerContainerName,
    bindContainerName,
    containerUsingDappmanagerIp,
    containerUsingBindIp,
  ];

  let network: Dockerode.Network;

  before(async () => {
    // get alpine docker images
    await docker.getImage(dockerImageTest).get();
    // create and start containers
    await Promise.all(
      containerNames.map(async (cn) => {
        const container = await docker.createContainer({
          Image: dockerImageTest,
          Cmd: ["tail", "-f", "/dev/null"], // Keep the container running
          name: cn,
        });
        await container.start();
      })
    );
    // create docker network
    network = (await docker.createNetwork({
      Name: networkName,
      Driver: "bridge",
      IPAM: {
        Driver: "default",
        Config: [
          {
            Subnet: dockerNetworkSubnet,
          },
        ],
      },
    })) as Dockerode.Network;
    // connect duplicate of dappmanager
    await dockerNetworkConnect(networkName, containerUsingDappmanagerIp, {
      IPAMConfig: {
        IPv4Address: dappmanagerIp,
      },
    });
    // connect duplicate of bind
    await dockerNetworkConnect(networkName, containerUsingBindIp, {
      IPAMConfig: {
        IPv4Address: bindIp,
      },
    });
  });

  it(`should connect all containers with prio to dappmanager and bind, freeing IPs used`, async () => {
    const aliasesMap = await getNetworkAliasesMapNotThrow(networkName);

    await connectContainersToNetworkWithPrio({
      network,
      dappmanagerContainer: {
        name: dappmanagerContainerName,
        ip: dappmanagerIp,
      },
      bindContainer: {
        name: bindContainerName,
        ip: bindIp,
      },
      aliasesMap,
    });
    const ipResult = (await docker.getContainer(bindContainerName).inspect())
      .NetworkSettings.Networks[networkName].IPAddress;
    // verify bind container with expected ip
    expect(ipResult).to.deep.equal(bindIp);
    const containers = (
      (await docker
        .getNetwork(networkName)
        .inspect()) as Dockerode.NetworkInspectInfo
    ).Containers;
    if (!containers) throw Error("containers not exist");
    const containerNames = Object.values(containers).map((c) => c.Name);
    expect(containerNames).to.include(containerUsingBindIp);
    expect(containerNames).to.include(containerUsingBindIp);
    expect(containerNames).to.include(dappmanagerContainerName);
    expect(containerNames).to.include(bindContainerName);
  });

  after(async () => {
    for (const cn of containerNames)
      await docker.getContainer(cn).remove({ force: true });

    // remove docker network
    await docker.getNetwork(networkName).remove();
  });
});
