import { expect } from "chai";
import fs from "fs";
import { PackageContainer } from "../../../src/common";
import { getPrivateNetworkAlias } from "../../../src/domains";
import {
  addNetworkAliasCompose,
  migrateCoreNetworkInCompose
} from "../../../src/modules/https-portal/utils";
import params from "../../../src/params";
import { mockContainer, shellSafe } from "../../testUtils";

describe("Migration", () => {
  const container: PackageContainer = {
    ...mockContainer,
    containerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
    dnpName: "test-migration",
    serviceName: "dappmanager.dnp.dappnode.eth",
    networks: [
      { name: "random", ip: "10.0.1.1" },
      { name: "dncore_network", ip: "172.33.1.7" }
    ]
  };

  const composeBefore = `
version: '3.4'
networks:
  network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.33.0.0/16
services:
  dappmanager.dnp.dappnode.eth:
    image: "chentex/random-logger"
    container_name: DAppNodeCore-dappmanager.dnp.dappnode.eth
    restart: always
    dns: 172.33.1.2
    networks:
      network:
        ipv4_address: 172.33.1.7`;

  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
  const containerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  const randomImage = "chentex/random-logger";
  const testMigrationPath =
    process.cwd() + "/test/integration/migrationCompose";

  before("Run random container", async () => {
    // Create compose
    await shellSafe(`mkdir ${testMigrationPath}/test-migration`);
    fs.writeFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      composeBefore
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

  it("Should do network migration", async () => {
    const composeExpected = `
version: '3.5'
networks:
  dncore_network:
    external: true
    name: dncore_network
services:
  dappmanager.dnp.dappnode.eth:
    image: chentex/random-logger
    container_name: DAppNodeCore-dappmanager.dnp.dappnode.eth
    restart: always
    dns: 172.33.1.2
    networks:
      dncore_network:
        ipv4_address: 172.33.1.7`;

    migrateCoreNetworkInCompose(container);
    const composeAfter = fs.readFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      { encoding: "utf8" }
    );
    expect(composeAfter.trim()).to.equal(composeExpected.trim());
  });

  it("Should do alias migration", () => {
    const composeExpected = `
version: '3.5'
networks:
  dncore_network:
    external: true
    name: dncore_network
services:
  dappmanager.dnp.dappnode.eth:
    image: chentex/random-logger
    container_name: DAppNodeCore-dappmanager.dnp.dappnode.eth
    restart: always
    dns: 172.33.1.2
    networks:
      dncore_network:
        ipv4_address: 172.33.1.7
        aliases:
          - dappmanager.dnp.dappnode.eth.test-migration.dappnode`;

    const alias = getPrivateNetworkAlias(container);
    addNetworkAliasCompose(container, dncoreNetwork, [alias]);
    const composeAfter = fs.readFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      { encoding: "utf8" }
    );
    expect(composeAfter.trim()).to.equal(composeExpected.trim());
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
