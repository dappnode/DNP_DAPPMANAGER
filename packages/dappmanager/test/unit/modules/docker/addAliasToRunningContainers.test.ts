import "mocha";
import fs from "fs";
import { expect } from "chai";
import { PackageContainer } from "@dappnode/common";
import { addAliasToGivenContainers } from "../../../../src/modules/migrations/addAliasToRunningContainers";
import { mockContainer, shellSafe } from "../../../testUtils.js";
import params from "../../../../src/params.js";

params.REPO_DIR = `${process.cwd()}/test/unit/modules/docker/test-alias/`;
params.DNP_PRIVATE_NETWORK_NAME = "dncore_network";

const DNP_NAME = "logger.dnp.dappnode.eth";
const DNP_NAME_MONO = "logger-mono.dnp.dappnode.eth";
const TEST_ALIAS_PATH = `${process.cwd()}/test/unit/modules/docker/test-alias/${DNP_NAME}`;
const TEST_ALIAS_PATH_MONO = `${process.cwd()}/test/unit/modules/docker/test-alias/${DNP_NAME_MONO}`;

const DNCORE_NETWORK = params.DNP_PRIVATE_NETWORK_NAME;

const monoContainer: PackageContainer = {
  ...mockContainer,
  containerName: "DAppNodeTest-logger.dnp.dappnode.eth",
  dnpName: `${DNP_NAME_MONO}`,
  serviceName: "monoService",
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

const containers = [containerMain, containerNotMain, monoContainer];

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

const MONO_COMPOSE = `
version: '3.4'
services:
  monoService:
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

describe("Add alias to running containers", function() {
  this.timeout(15000); // Adjusts the timeout (in ms) for all hooks and tests in this suite

  before("Create and run containers in dncore_network", async () => {
    if (!fs.existsSync(TEST_ALIAS_PATH)) {
      fs.mkdirSync(TEST_ALIAS_PATH, { recursive: true });
    }
    fs.writeFileSync(`${TEST_ALIAS_PATH}/docker-compose.yml`, CONTAINER_COMPOSE);
    await shellSafe(`docker-compose -f ${TEST_ALIAS_PATH}/docker-compose.yml up -d`);


    if (!fs.existsSync(TEST_ALIAS_PATH_MONO)) {
      fs.mkdirSync(TEST_ALIAS_PATH_MONO, { recursive: true });
    }
    fs.writeFileSync(`${TEST_ALIAS_PATH_MONO}/docker-compose.yml`, MONO_COMPOSE);
    await shellSafe(`docker-compose -f ${TEST_ALIAS_PATH_MONO}/docker-compose.yml up -d`);

    const [containerMainExists, containerNotMainExists, monoContainerExists, networkExists] = await Promise.all([
      shellSafe(`docker container ls --filter name=${containerMain.containerName}`),
      shellSafe(`docker container ls --filter name=${containerNotMain.containerName}`),
      shellSafe(`docker container ls --filter name=${monoContainer.containerName}`),
      shellSafe(`docker network ls --filter name=${DNCORE_NETWORK}`)
    ]);

    if (!containerMainExists || !containerNotMainExists || !monoContainerExists || !networkExists) {
      throw new Error("Error creating container or/and DNCORE_NETWORK");
    }

    await Promise.all([
      shellSafe(`docker network connect ${DNCORE_NETWORK} ${containerMain.containerName}`),
      shellSafe(`docker network connect ${DNCORE_NETWORK} ${containerNotMain.containerName}`),
      shellSafe(`docker network connect ${DNCORE_NETWORK} ${monoContainer.containerName}`)
    ]);
  });

  it.only("check that both containers have expected aliases", async () => {
    // Add the aliases
    await addAliasToGivenContainers(containers);

    const containerMainAliases = await getContainerAliasesOnNetwork(containerMain.containerName, DNCORE_NETWORK);
    const containerNotMainAliases = await getContainerAliasesOnNetwork(containerNotMain.containerName, DNCORE_NETWORK);
    const monoContainerAliases = await getContainerAliasesOnNetwork(monoContainer.containerName, DNCORE_NETWORK);

    // Define the expected aliases. These should match the aliases added by the `addAliasToGivenContainers` function.
    const expectedMainAliases = ["mainService.logger.dappnode", "logger.dappnode"];
    const expectedNotMainAliases = ["notmainService.logger.dappnode"];
    const expectedMonoContainerAliases = ["monoService.logger-mono.dappnode"];

    // Assert that the actual aliases match our expectations
    expect(containerMainAliases).to.include.members(expectedMainAliases);
    expect(containerNotMainAliases).to.include.members(expectedNotMainAliases);
    expect(monoContainerAliases).to.include.members(expectedMonoContainerAliases);

  });

  after("Cleanup", async () => {
    await Promise.all([
      shellSafe(`docker stop ${containerMain.containerName}`),
      shellSafe(`docker stop ${containerNotMain.containerName}`),
      shellSafe(`docker stop ${monoContainer.containerName}`),
      shellSafe(`docker rm ${containerMain.containerName} --force`),
      shellSafe(`docker rm ${containerNotMain.containerName} --force`),
      shellSafe(`docker rm ${monoContainer.containerName} --force`),

      shellSafe(`rm -rf ${TEST_ALIAS_PATH}`),
      shellSafe(`rm -rf ${TEST_ALIAS_PATH_MONO}`)
    ]);
  });

});

