import "mocha";
import fs from "fs";
import { expect } from "chai";
import { PackageContainer } from "@dappnode/common";
import { addAliasToGivenContainers } from "../../../../src/modules/migrations/addAliasToRunningContainers";
import { mockContainer, shellSafe } from "../../../testUtils.js";
import { params } from "@dappnode/params";

const DNP_NAME = "logger.dnp.dappnode.eth";
const DNP_NAME_MONO = "logger-mono.dnp.dappnode.eth";
const DNP_NAME_PUBLIC = "logger.public.dappnode.eth";

const TEST_ALIAS_PATH = `dnp_repo/${DNP_NAME}`;
const TEST_ALIAS_PATH_MONO = `dnp_repo/${DNP_NAME_MONO}`;
const TEST_ALIAS_PATH_PUBLIC = `dnp_repo/${DNP_NAME_PUBLIC}`;


const DNCORE_NETWORK = params.DNP_PRIVATE_NETWORK_NAME;

const monoContainer: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.dnp.dappnode.eth",
  dnpName: `${DNP_NAME_MONO}`,
  serviceName: `service`,
  isCore: false,
};

const containerMain: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.main.dnp.dappnode.eth",
  dnpName: `${DNP_NAME}`,
  serviceName: "mainService",
  isMain: true,
  isCore: false,
};

const containerNotMain: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.notmain.dnp.dappnode.eth",
  dnpName: `${DNP_NAME}`,
  serviceName: "notmainService",
  isMain: false,
  isCore: false,
};

const containerMainPublic: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.main.public.dappnode.eth",
  dnpName: `${DNP_NAME_PUBLIC}`,
  serviceName: "mainService",
  isMain: true,
  isCore: false,
};

const containerNotMainPublic: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.notmain.public.dappnode.eth",
  dnpName: `${DNP_NAME_PUBLIC}`,
  serviceName: "notmainService",
  isMain: false,
  isCore: false,
};

const containers = [containerMain, containerNotMain, monoContainer, containerMainPublic, containerNotMainPublic];

const CONTAINER_COMPOSE = `
version: '3.4'
services:
  notmainService:
    image: "chentex/random-logger"
    container_name: ${containerNotMain.containerName}
  mainService:
    image: "chentex/random-logger"
    container_name: ${containerMain.containerName}
`;

const CONTAINER_COMPOSE_PUBLIC = `
version: '3.4'
services:
  notmainService:
    image: "chentex/random-logger"
    container_name: ${containerNotMainPublic.containerName}
  mainService:
    image: "chentex/random-logger"
    container_name: ${containerMainPublic.containerName}
`;

const MONO_COMPOSE = `
version: '3.4'
services:
  service:
    image: "chentex/random-logger"
    container_name: ${monoContainer.containerName}
`;

// Inspect each container and fetch the aliases on the dncore network
async function getContainerAliasesOnNetwork(containerName: string, networkName: string) {
  const inspectData = await shellSafe(`docker container inspect ${containerName}`);
  if (!inspectData) throw new Error(`Error inspecting container ${containerName}`);
  const parsedData = JSON.parse(inspectData);

  // Extract the aliases from the specified network
  const aliases = parsedData[0]?.NetworkSettings?.Networks?.[networkName]?.Aliases || [];
  return aliases;
}

// Helper function to stop and remove containers
async function stopAndRemoveContainers(containerNames: string[]) {
  for (const containerName of containerNames) {
    await shellSafe(`docker stop ${containerName}`);
    await shellSafe(`docker rm ${containerName} --force`);
  }
}

// Helper function to remove directories
async function removeDirectories(directoryPaths: string[]) {
  for (const directoryPath of directoryPaths) {
    await shellSafe(`rm -rf ${directoryPath}`);
  }
}

describe("Add alias to running containers", function() {
  this.timeout(60000); // Adjusts the timeout (in ms) for all hooks and tests in this suite
  before("Create and run containers in dncore_network", async () => {

    const composeConfigs = [
      { path: TEST_ALIAS_PATH, content: CONTAINER_COMPOSE },
      { path: TEST_ALIAS_PATH_MONO, content: MONO_COMPOSE },
      { path: TEST_ALIAS_PATH_PUBLIC, content: CONTAINER_COMPOSE_PUBLIC },
    ];
    
    for (const config of composeConfigs) {
      const { path, content } = config;
    
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    
      fs.writeFileSync(`${path}/docker-compose.yml`, content);
    
      await shellSafe(`docker-compose -f ${path}/docker-compose.yml up -d`);
    }
    
    const containerNamesToCheck = [
      containerMain.containerName,
      containerNotMain.containerName,
      monoContainer.containerName,
      containerMainPublic.containerName,
      containerNotMainPublic.containerName,
    ];
    
    // Check if all containers exist
    const containerExistsPromises = containerNamesToCheck.map((containerName) =>
      shellSafe(`docker container ls --filter name=${containerName}`)
    );
    
    const containerExistResults = await Promise.all(containerExistsPromises);
    
    if (containerExistResults.some((result) => !result)) {
      throw new Error("Error creating containers");
    }
    
    // Connect containers to the network
    const connectToNetworkPromises = containerNamesToCheck.map((containerName) =>
      shellSafe(`docker network connect ${DNCORE_NETWORK} ${containerName}`)
    );
    
    await Promise.all(connectToNetworkPromises);
  });

  it("check that all containers have expected aliases", async () => {
    // Add the aliases
    await addAliasToGivenContainers(containers);

    const containersToTest = [
      { container: containerMain, expectedAliases: ["mainService.logger.dappnode", "logger.dappnode"] },
      { container: containerNotMain, expectedAliases: ["notmainService.logger.dappnode"] },
      { container: monoContainer, expectedAliases: ["service.logger-mono.dappnode"] },
      { container: containerMainPublic, expectedAliases: ["mainService.logger.public.dappnode", "logger.public.dappnode"] },
      { container: containerNotMainPublic, expectedAliases: ["notmainService.logger.public.dappnode"] },
    ];
    
    for (const { container, expectedAliases } of containersToTest) {
      const actualAliases = await getContainerAliasesOnNetwork(container.containerName, DNCORE_NETWORK);
      expect(actualAliases).to.include.members(expectedAliases);
    }
  });

  after("Cleanup", async () => {
    const containerNames = containers.map((container) => container.containerName);
    const directoryPaths = [TEST_ALIAS_PATH, TEST_ALIAS_PATH_MONO, TEST_ALIAS_PATH_PUBLIC];
  
    await Promise.all([
      stopAndRemoveContainers(containerNames),
      removeDirectories(directoryPaths)
    ]);
  });
});
