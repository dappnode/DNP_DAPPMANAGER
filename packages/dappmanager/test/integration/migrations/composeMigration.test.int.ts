import { expect } from "chai";
import fs from "fs";
import { PackageContainer } from "@dappnode/common";
import { migrateCoreNetworkAndAliasInCompose } from "../../../src/modules/migrations/addAliasToRunningContainers.js";
import { params } from "@dappnode/params";
import { mockContainer, shellSafe } from "../../testUtils.js";
import { removeDnsFromComposeFiles } from "../../../src/modules/migrations/removeDnsFromComposeFiles.js";

describe("Migration", () => {
  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
  const containerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  const serviceName = "dappmanager";
  const randomImage = "chentex/random-logger";
  const testMigrationPath = process.cwd() + "/test/integration/migrations";

  const container: PackageContainer = {
    ...mockContainer,
    containerName,
    dnpName: "test-migration",
    serviceName,
    networks: [
      { name: "random", ip: "10.0.1.1" },
      { name: dncoreNetwork, ip: "172.33.1.7" }
    ]
  };

  const composeNoDns = `
version: '3.4'
networks:
${dncoreNetwork}:
  name: ${dncoreNetwork}
  external: true
services:
${serviceName}:
  image: "${randomImage}"
  container_name: ${containerName}
  restart: always
  networks:
    ${dncoreNetwork}:
      ipv4_address: 172.33.1.7
      aliases:
      - ${serviceName}.test-migration.dappnode
      - ${serviceName}.dappnode`;

  const composeAlreadyMigrated = `
version: '3.5'
networks:
${dncoreNetwork}:
  name: ${dncoreNetwork}
  external: true
services:
${serviceName}:
  image: ${randomImage}
  container_name: ${containerName}
  restart: always
  dns: 172.33.1.2
  networks:
  ${dncoreNetwork}:
      ipv4_address: 172.33.1.7
      aliases:
        - ${serviceName}.test-migration.dappnode
        - ${serviceName}.dappnode`;

  const composeToBeMigratedBefore = `
version: '3.4'
networks:
${dncoreNetwork}:
  name: ${dncoreNetwork}
  external: true
services:
${serviceName}:
  image: "${randomImage}"
  container_name: ${containerName}
  restart: always
  dns: 172.33.1.2
  networks:
    ${dncoreNetwork}:
      ipv4_address: 172.33.1.7
      aliases:
      - ${serviceName}.test-migration.dappnode
      - ${serviceName}.dappnode`;

  before("Run random container", async () => {
    // Create compose
    await shellSafe(`mkdir ${testMigrationPath}/test-migration`);
    // Compose to be migrated
    fs.writeFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      composeToBeMigratedBefore
    );
    // Compose already migrated
    fs.writeFileSync(
      `${testMigrationPath}/test-migration/docker-compose-migrated.yml`,
      composeAlreadyMigrated
    );
    // Redeclare global variables
    params.DNCORE_DIR = testMigrationPath;
    params.REPO_DIR = testMigrationPath;
    // Startup container
    await shellSafe(
      `docker-compose -f ${testMigrationPath}/test-migration/docker-compose.yml -p DNCORE up -d`
    );
    const containerkExists = await shellSafe(
      `docker container ls --filter name=${containerName}`
    );

    const networkExists = await shellSafe(
      `docker network ls --filter name=${dncoreNetwork}`
    );

    if (!containerkExists || !networkExists)
      throw Error("Error creating container or/and dncore_network");
  });

  it("Should do alias migration in compose", async () => {
    const aliases = ["dappmanager.dnp.dappnode.eth.test-migration.dappnode", "dappmanager.dappnode"];
    migrateCoreNetworkAndAliasInCompose(container, aliases);

    const composeAfter = fs.readFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      { encoding: "utf8" }
    );
    expect(composeAfter.trim()).to.equal(composeAlreadyMigrated.trim());
  });


  it("Should remove DNS from compose file", async () => {
    await removeDnsFromComposeFiles();

    const composeAfter = fs.readFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      { encoding: "utf8" }
    );
    expect(composeAfter.trim()).to.equal(composeNoDns.trim());
  });

  after("Remove test setup", async () => {
    // Disconnect from network
    await shellSafe(
      `docker network disconnect ${dncoreNetwork} ${containerName} --force`
    );
    // Remove network
    await shellSafe(`docker network rm dncore_network`);
    // Remove container
    await shellSafe(`docker rm ${containerName} --force`);
    // Remove image
    await shellSafe(`docker image rm ${randomImage}`);
    // Remove dir
    await shellSafe(`rm -rf ${testMigrationPath}/test-migration`);

    // Return global vars to tests normal values
    params.DNCORE_DIR = "./DNCORE";
    params.REPO_DIR = "./dnp_repo";
  });
});
