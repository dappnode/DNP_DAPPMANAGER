import "mocha";
import { expect } from "chai";
import { ensureDockerNetworkConfig } from "../../../src/ensureDockerNetworkConfig/index.js";
import { docker } from "@dappnode/dockerapi";

describe.skip("Ensure docker network config migration => ensureDockerNetworkConfig", () => {
  const dockerNetworkName = "dncore_test";
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
  });

  it("Should ensure the docker network is in valid ip range", async () => {
    //await ensureDockerNetworkConfig();
  });

  after(async () => {
    for (const cn of containerNames)
      await docker.getContainer(cn).remove({ force: true });

    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
