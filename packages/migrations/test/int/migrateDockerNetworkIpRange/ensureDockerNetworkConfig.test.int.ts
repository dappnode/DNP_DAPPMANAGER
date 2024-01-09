import "mocha";
import { expect } from "chai";
import { ensureDockerNetworkConfig } from "../../../src/migrateDockerNetworkIpRange/ensureDockerNetworkConfig/index.js";
import { docker, dockerNetworkConnect } from "@dappnode/dockerapi";
import Dockerode from "dockerode";

describe("Ensure docker network config migration => ensureDockerNetworkConfig", () => {
  const dockerNetworkName = "dncore_test";
  const dockerNetworkSubnet = "172.30.0.0/16";
  const dockerImageTest = "alpine";
  const containerNames = [
    "test_container_1",
    "test_container_2",
    "test_container_3",
  ]; // Define container names

  before(async () => {
    // get alpine docker images
    await docker.getImage(dockerImageTest).get();
    // create and start docker containers
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
      Name: dockerNetworkName,
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

    // connect al containers to network
    await Promise.all(
      containerNames.map(
        async (cn) => await dockerNetworkConnect(dockerNetworkName, cn)
      )
    );
  });

  it("should ensure the docker network config", async () => {
    const newDockerNetworkSubnet = "172.29.0.0/16";
    await ensureDockerNetworkConfig({
      networkName: dockerNetworkName,
      networkSubnet: newDockerNetworkSubnet,
    });
    const recreatedNetwork: Dockerode.NetworkInspectInfo = await docker
      .getNetwork(dockerNetworkName)
      .inspect();
    const recreatedNetworkConfig = recreatedNetwork.IPAM?.Config;
    if (!recreatedNetworkConfig) throw Error("docker network config not found");
    // validate new ip range
    expect(recreatedNetworkConfig[0].Subnet).to.deep.equal(
      newDockerNetworkSubnet
    );
    // validate all containers are connected
    const containers = (
      (await docker
        .getNetwork(dockerNetworkName)
        .inspect()) as Dockerode.NetworkInspectInfo
    ).Containers;
    if (!containers) throw Error("containers not exist");
    const containerNamesConnected = Object.values(containers).map(
      (c) => c.Name
    );
    for (const cn of containerNamesConnected) {
      expect(containerNames).to.include(cn);
    }
  });

  after(async () => {
    for (const cn of containerNames)
      await docker.getContainer(cn).remove({ force: true });

    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
