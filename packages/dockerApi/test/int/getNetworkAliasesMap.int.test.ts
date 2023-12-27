import "mocha";
import { expect } from "chai";
import { docker, getNetworkAliasesMapNotThrow } from "@dappnode/dockerapi";

describe("Ensure docker network config migration => getDockerNetworkNameFromSubnet", () => {
  const testNetworkName = "docker_network_test";
  const testNetworkSubnet = "172.40.0.0/16";
  const testImage = "alpine:latest";
  const testContainerNames = [
    "test_container_1",
    "test_container_2",
    "test_container_3",
  ];
  let testNetwork;

  before(async () => {
    await removeAll();

    // Create network
    testNetwork = await docker.createNetwork({
      Name: testNetworkName,
      Driver: "bridge",
      IPAM: {
        Driver: "default",
        Config: [{ Subnet: testNetworkSubnet }],
      },
    });

    // Pull image and wait for completion
    await new Promise<void>((resolve, reject) => {
      docker.pull(testImage, (err: Error, stream: NodeJS.ReadableStream) => {
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
      });
    });

    const containerPromises = testContainerNames.map(async (cn) => {
      const container = await docker.createContainer({
        Image: testImage, // Ensure the image is correctly referenced
        Cmd: ["sleep", "infinity"], // Use a command that is available in alpine
        name: cn,
      });
      await container.start();
      return container;
    });


    // Connect containers to network
    await Promise.all(
      containerPromises.map(async (containerPromise) => {
        const container = await containerPromise;
        const containerInfo = await container.inspect();
        const containerName = containerInfo.Name.replace(/^\//, ""); // Removing leading slash

        await testNetwork.connect({
          Container: container.id,
          EndpointConfig: {
            Aliases: [`alias_${containerName}`],
          },
        });
      })
    );
  });

  it("should return a map of the containers and aliases connected to the test network", async () => {
    const aliasMap = await getNetworkAliasesMapNotThrow(testNetworkName);

    expect(aliasMap.size).to.equal(testContainerNames.length);
    testContainerNames.forEach((containerName) => {
      const expectedAlias = `alias_${containerName}`;
      const aliases = aliasMap.get(containerName);
      expect(aliases).to.include(
        expectedAlias,
        `Container ${containerName} should have alias ${expectedAlias}`
      );
    });

  });

  after(async () => {
    await removeAll();
  });

  async function removeAll() {
    // Gracefully remove docker containers
    await Promise.all(
      testContainerNames.map(async (cn) => {
        const container = docker.getContainer(cn);
        if (container) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          await container.remove({ force: true }).catch(() => { });
        }
      })
    );

    // Remove docker network
    if (testNetwork) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await testNetwork.remove().catch(() => { });
    }
  }
});
