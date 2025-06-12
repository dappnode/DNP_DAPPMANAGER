import { expect } from "chai";
import fs from "fs";
import { PackageContainer } from "@dappnode/types";
import { migrateCoreNetworkAndAliasInCompose, removeDnsFromPackageComposeFile } from "../../src/removeDnsAndAddAlias.js";
import { params } from "@dappnode/params";
import { mockContainer, shellSafe } from "../testUtils.js";

describe("Migration", () => {
  const dncoreNetwork = params.DOCKER_PRIVATE_NETWORK_NAME;
  const serviceName = "test";
  const containerName = "DAppNodePackage-test.dnp.dappnode.eth";
  const randomImage = "chentex/random-logger";
  const dnpName = "test-migration.dnp.dappnode.eth";
  const testPackagePath = `${params.REPO_DIR}/test-migration.dnp.dappnode.eth`;

  const container: PackageContainer = {
    ...mockContainer,
    containerName,
    dnpName,
    serviceName,
    networks: [
      { name: "random", ip: "10.0.1.1" },
      { name: "dncore_network", ip: "172.33.1.7" }
    ]
  };

  const composeNoDns = `
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
    image: ${randomImage}
    container_name: ${containerName}
    restart: always
    networks:
      ${dncoreNetwork}:
        ipv4_address: 172.33.1.7`;

  before("Run random container", async () => {
    // Create compose
    await shellSafe(`mkdir -p ${testPackagePath}`);
    // Compose to be migrated
    fs.writeFileSync(`${testPackagePath}/docker-compose.yml`, composeToBeMigratedBefore);

    // Startup container
    await shellSafe(`docker compose -f ${testPackagePath}/docker-compose.yml -p DNCORE up -d`);
    const containerExists = await shellSafe(`docker container ls --filter name=${containerName}`);

    const networkExists = await shellSafe(`docker network ls --filter name=${dncoreNetwork}`);

    if (!containerExists || !networkExists) throw Error("Error creating container or/and dncore_network");
  });

  it("Should do alias migration in compose", async () => {
    const aliases = ["test.test-migration.dappnode", "test.dappnode"];
    migrateCoreNetworkAndAliasInCompose(container, aliases);

    const composeAfter = fs.readFileSync(`${testPackagePath}/docker-compose.yml`, { encoding: "utf8" });
    expect(composeAfter.trim()).to.equal(composeAlreadyMigrated.trim());
  });

  it("Should remove DNS from compose file", async () => {
    removeDnsFromPackageComposeFile(container.dnpName, false);

    const composeAfter = fs.readFileSync(`${testPackagePath}/docker-compose.yml`, { encoding: "utf8" });
    expect(composeAfter.trim()).to.equal(composeNoDns.trim());
  });

  after("Remove test setup", async () => {
    // Disconnect from network
    await shellSafe(`docker network disconnect ${dncoreNetwork} ${containerName} --force`);
    // Remove network
    await shellSafe(`docker network rm dncore_network`);
    // Remove container
    await shellSafe(`docker rm ${containerName} --force`);
    // Remove image
    await shellSafe(`docker image rm ${randomImage}`);
    // Remove dir
    await shellSafe(`rm -rf ${testPackagePath}`);
  });
});
