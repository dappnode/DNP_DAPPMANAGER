import { expect } from "chai";
import {
  disconnectAllContainersFromNetwork,
  docker,
  dockerCreateNetwork,
  dockerNetworkConnect,
  getNetworkAliasesIpsMapNotThrow,
} from "../../src/index.js";
import Dockerode from "dockerode";

// This test will only work if you have a running dappmanager container with DN_CORE network
describe("dockerApi => network", function () {
  this.timeout(5 * 1000);

  const dockerNetworkName = "dncore_test";
  const dockerImageTest = "alpine:latest";
  const containerNames = [
    "test_container_1",
    "test_container_2",
    "test_container_3",
  ]; // Define container names

  before(async () => {
    // Pull image and wait for completion
    await new Promise<void>((resolve, reject) => {
      docker.pull(
        dockerImageTest,
        (err: Error, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
          } else {
            docker.modem.followProgress(stream, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        }
      );
    });
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
        async (cn) =>
          await dockerNetworkConnect(dockerNetworkName, cn, {
            Aliases: [cn],
          })
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

  it("should get network aliases and IPs for every connected container", async () => {
    const aliasesIps = await getNetworkAliasesIpsMapNotThrow(dockerNetworkName);

    containerNames.forEach((containerName) => {
      // Retrieve the aliases array for this container
      const containerAliases = aliasesIps.get(containerName)?.aliases;
      // Assert that the aliases map contains an entry for this container
      expect(containerAliases?.includes(containerName)).to.be.true;
      // Assert that the containerAliases array is not empty and contains expected values
      expect(containerAliases).to.be.an("array").that.is.not.empty;
      expect(containerAliases).to.include(containerName); // Check for the full alias

      // If you have specific expectations for the second alias, you can add checks here
      // For example, if you know the pattern of the second alias, you can assert it
      // Example: expect(containerAliases[1]).to.match(/some-regex-pattern/);
    });
  });

  it("should disconnect all docker containers from a docker network", async () => {
    await disconnectAllContainersFromNetwork(
      docker.getNetwork(dockerNetworkName)
    );
  });

  after(async () => {
    // remove containers
    for (const cn of containerNames)
      await docker.getContainer(cn).remove({ force: true });

    // remove docker network
    await docker.getNetwork(dockerNetworkName).remove();
  });
});
