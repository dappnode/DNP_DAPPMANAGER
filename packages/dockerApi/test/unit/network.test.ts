// getDnCoreNetworkConfig.test.js
import { expect } from "chai";
import mocha from "mocha";
import {
  disconnectAllContainersFromNetwork,
  docker,
  dockerCreateNetwork,
  dockerNetworkConnect,
} from "../../src/index.js";

// This test will only work if you have a running dappmanager container with DN_CORE network
describe("dockerApi => network", () => {
  const dockerNetworkName = "dncore_test";
  const dockerImageTest = "hello-world";
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
          name: cn,
          Cmd: ["/hello"],
        });
        await container.start();
      })
    );
  });

  it("should create a docker network with default plugin bridge", async () => {
    await dockerCreateNetwork(dockerNetworkName);
  });

  it("should connect multiple docker containers to a docker network", async () => {
    await Promise.all(
      containerNames.map(async (cn) =>
        dockerNetworkConnect(dockerNetworkName, cn)
      )
    );
  });

  it("should disconnect all docker containers from a docker network", async () => {
    await disconnectAllContainersFromNetwork(dockerNetworkName);
  });

  after(async () => {
    // remove containers
    await Promise.all(
      containerNames.map((cn) => docker.getContainer(cn).remove())
    );

    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
