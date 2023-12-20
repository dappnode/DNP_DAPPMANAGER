// getDnCoreNetworkConfig.test.js
import { expect } from "chai";
import mocha from "mocha";
import {
  disconnectAllContainersFromNetwork,
  docker,
  dockerCreateNetwork,
  dockerNetworkConnect,
} from "../../src/index.js";
import Dockerode from "dockerode";
import { shell } from "@dappnode/utils";

// This test will only work if you have a running dappmanager container with DN_CORE network
describe.only("dockerApi => network", () => {
  const dockerNetworkName = "dncore_test";
  const dockerImageTest = "alpine";
  const containerNames = [
    "test_container_1",
    "test_container_2",
    "test_container_3",
  ]; // Define container names

  before(async () => {
    await docker.getImage(dockerImageTest).get();
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
  });

  it("should create a docker network with default plugin bridge", async () => {
    await dockerCreateNetwork(dockerNetworkName);

    const network = docker.getNetwork(dockerNetworkName);
    const networkInspect =
      (await network.inspect()) as Dockerode.NetworkInspectInfo;
    expect(networkInspect.Name).to.deep.equal(dockerNetworkName);
  });

  it("should connect multiple docker containers to a docker network", async () => {
    await Promise.all(
      containerNames.map(
        async (cn) => await dockerNetworkConnect(dockerNetworkName, cn)
      )
    );

    const network = docker.getNetwork(dockerNetworkName);
    const networkInspect =
      (await network.inspect()) as Dockerode.NetworkInspectInfo;
    const containersInNetwork = networkInspect.Containers;
    if (!containersInNetwork) throw Error(`Expected containers in network`);
    const containersNames = Object.values(containersInNetwork).map(
      (c) => c.Name
    );
    expect(containersNames).to.have.deep.members(containerNames);
  });

  it("should disconnect all docker containers from a docker network", async () => {
    await disconnectAllContainersFromNetwork(dockerNetworkName);
  });

  after(async () => {
    // remove containers
    await Promise.all([
      containerNames.map((cn) => docker.getContainer(cn).kill()),
    ]);

    await Promise.all([
      containerNames.map((cn) => docker.getContainer(cn).remove()),
    ]);

    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
