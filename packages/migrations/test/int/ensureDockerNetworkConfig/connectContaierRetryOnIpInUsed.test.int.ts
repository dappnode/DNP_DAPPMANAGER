import "mocha";
import { expect } from "chai";
import { docker, dockerNetworkConnect } from "@dappnode/dockerapi";
import { connectContaierRetryOnIpInUsed } from "../../../src/ensureDockerNetworkConfig/connectContaierRetryOnIpInUsed.js";
import Dockerode from "dockerode";

describe("Ensure docker network config migration => connectContaierRetryOnIpInUsed", () => {
  const networkName = "dncore_test";
  const dockerNetworkSubnet = "172.30.0.0/16";
  const dockerImageTest = "alpine";
  const dappmanagerContainerName = "test_container_1";
  const dappmanagerIp = "172.30.0.7";
  const bindContainerName = "test_container_2";
  const bindIp = "172.30.0.2";
  const containerUsingDappmanagerIp = "test_container_3";
  const containerUsingBindIp = "test_container_4";

  const containerNames = [
    dappmanagerContainerName,
    bindContainerName,
    containerUsingDappmanagerIp,
    containerUsingBindIp,
  ];

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
    await docker.createNetwork({
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
    });
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

  it(`should disconnect the container ${containerUsingDappmanagerIp}, connect ${dappmanagerContainerName} and finally reconnect the first one`, async () => {
    await connectContaierRetryOnIpInUsed({
      networkName,
      containerName: dappmanagerContainerName,
      maxAttempts: 2,
      ip: dappmanagerIp,
    });
    const ipResult = (
      await docker.getContainer(dappmanagerContainerName).inspect()
    ).NetworkSettings.Networks[networkName].IPAddress;
    // verify dappmanager container with expected ip
    expect(ipResult).to.deep.equal(dappmanagerIp);
    const containers = (
      (await docker
        .getNetwork(networkName)
        .inspect()) as Dockerode.NetworkInspectInfo
    ).Containers;
    if (!containers) throw Error("containers not exist");
    const containerNames = Object.values(containers).map((c) => c.Name);
    expect(containerNames).to.include(containerUsingDappmanagerIp);
  });

  it(`should disconnect the container ${containerUsingBindIp}, connect ${bindContainerName} and finally reconnect the first one`, async () => {
    await connectContaierRetryOnIpInUsed({
      networkName,
      containerName: bindContainerName,
      maxAttempts: 2,
      ip: bindIp,
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
  });

  after(async () => {
    for (const cn of containerNames)
      await docker.getContainer(cn).remove({ force: true });

    // remove docker network
    await docker.getNetwork(networkName).remove();
  });
});
