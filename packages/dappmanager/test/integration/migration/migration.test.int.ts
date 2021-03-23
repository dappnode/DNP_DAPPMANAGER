import { expect } from "chai";
import fs from "fs";
import { PackageContainer } from "../../../src/common";
import { migrateCoreNetworkInCompose } from "../../../src/modules/https-portal/utils";
import params from "../../../src/params";
import shell from "../../../src/utils/shell";

describe.only("Migration", () => {
  const composeBefore = `
version: "3.4"
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

  const composeExpected = `
version: "3.4"
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

  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
  const containerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  const randomImage = "chentex/random-logger";
  const testMigrationPath = process.cwd() + "/test/integration/migration";

  before("Run random container", async () => {
    // Create compose
    await shell(`mkdir ${testMigrationPath}/test-migration`);
    fs.writeFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      composeBefore
    );
    // Redeclare global variables
    params.DNCORE_DIR = testMigrationPath;
    params.REPO_DIR = testMigrationPath;
    // Startup container
    await shell(
      `docker-compose -f ${testMigrationPath}/test-migration/docker-compose.yml -p DNCORE up -d`
    );
    const containerkExists = await shell(
      `docker container ls --filter name=${containerName}`
    );

    const networkExists = await shell(
      `docker network ls --filter name=${dncoreNetwork}`
    );

    if (!containerkExists || !networkExists)
      throw Error("Error creating container or/and dncore_network");
  });

  it("Should do network migration", async () => {
    const container: PackageContainer = {
      containerId:
        "aa3cfc714b7dc0f5667795db520a7c132a1e8eade8268a0f8f1e0c63b73ee4ab",
      containerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
      dnpName: "test-migration",
      serviceName: "dappmanager.dnp.dappnode.eth",
      instanceName: "",
      version: "0.2.38",
      created: 0,
      image:
        "sha256:00e8945bfe1a8d2f4fd1e50cd14c3c97e653ba044277c1cd31771ac866eb055d",
      state: "running",
      running: true,
      exitCode: 0,
      ports: [],
      volumes: [],
      networks: [
        { name: "random", ip: "10.0.1.1" },
        { name: "dncore_network", ip: "172.33.1.7" }
      ],
      isDnp: true,
      isCore: false,
      dependencies: {},
      avatarUrl: ""
    };
    //const alias = getPrivateNetworkAlias(container);
    migrateCoreNetworkInCompose(container);
    const composeAfter = fs.readFileSync(
      `${testMigrationPath}/test-migration/docker-compose.yml`,
      { encoding: "utf-8" }
    );
    console.log(composeAfter);
    console.log(composeExpected);
    expect(composeAfter).to.equal(composeExpected);
  });

  after("Remove test setup", async () => {
    // Disconnect from network
    await shell(
      `docker network disconnect ${dncoreNetwork} ${containerName} --force`
    );
    // Remove network
    await shell(`docker network rm dncore_network`);
    // Remove container
    await shell(`docker rm ${containerName} --force`);
    // Remove image
    await shell(`docker image rm ${randomImage}`);
    // Remove dir
    await shell(`rm -rf ${testMigrationPath}/test-migration`);
  });
});
