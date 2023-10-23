import { expect } from "chai";
import fs from "fs";
import { removeDnsFromComposeFiles } from "../../../src/modules/migrations/removeDnsFromComposeFiles.js";
import { params } from "@dappnode/params";
import { shellSafe } from "../../testUtils.js";

describe("Remove DNS from all compose files", () => {
    const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
    const containerName = "DAppNodeCore-dappmanager.dnp.dappnode.eth";
    const serviceName = "dappmanager";
    const randomImage = "chentex/random-logger";
    const composeDnsRemovalTestPath = process.cwd() + "/test/integration/composeDnsRemoval";

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
        await shellSafe(`mkdir ${composeDnsRemovalTestPath}/test-dns-removal`);
        // Compose to be migrated
        fs.writeFileSync(
            `${composeDnsRemovalTestPath}/test-dns-removal/docker-compose.yml`,
            composeToBeMigratedBefore
        );
        // Compose already migrated
        fs.writeFileSync(
            `${composeDnsRemovalTestPath}/test-dns-removal/docker-compose-migrated.yml`,
            composeAlreadyMigrated
        );
        // Redeclare global variables
        params.DNCORE_DIR = composeDnsRemovalTestPath;
        params.REPO_DIR = composeDnsRemovalTestPath;
        // Startup container
        await shellSafe(
            `docker-compose -f ${composeDnsRemovalTestPath}/test-dns-removal/docker-compose.yml -p DNCORE up -d`
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
        await removeDnsFromComposeFiles();

        const composeAfter = fs.readFileSync(
            `${composeDnsRemovalTestPath}/test-migration/docker-compose.yml`,
            { encoding: "utf8" }
        );
        expect(composeAfter.trim()).to.equal(composeAlreadyMigrated.trim());
    });

    // TODO: Add test for non-core package

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
        await shellSafe(`rm -rf ${composeDnsRemovalTestPath}/test-migration`);

        // Return global vars to tests normal values
        params.DNCORE_DIR = "./DNCORE";
        params.REPO_DIR = "./dnp_repo";
    });
});
