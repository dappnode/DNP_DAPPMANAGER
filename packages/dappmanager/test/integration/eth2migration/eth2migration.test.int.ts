import "mocha";
import { expect } from "chai";
import shell from "../../../src/utils/shell";
import { shellSafe } from "../../testUtils";

describe.only("eth2migrations", function () {
  const composePath = `${__dirname}/DAppNodePackage-prysm-prater/docker-compose.yml`;

  before(async () => {
    // web3signer installation package
    // eth2client (teku prater) installation package
  });

  before(async () => {
    const validatorContainerName =
      "DAppNodePackage-validator.prysm-prater.dnp.dappnode.eth";
    // Create necessary network
    await shellSafe("docker network create dncore_network");

    // Setup validator container: run DAppNodePackage-prysm-prater
    await shell(`docker-compose -f ${composePath} up -d`);

    // Copy files to container
    await shell(`docker cp ${__dirname}/files ${validatorContainerName}:/`);
    const dirs = await shell(
      `docker exec ${validatorContainerName} ls -l /files`
    );
    console.log(dirs);
    // Import keystores: https://docs.prylabs.network/docs/install/install-with-docker/#step-3-import-keystores-into-prysm
    await shell(
      `docker exec ${validatorContainerName} validator accounts import --keys-dir=/files/keystore_0.json`
    );
    // Import slashing protection: https://docs.prylabs.network/docs/wallet/slashing-protect
    await shell(
      `docker exec  ${validatorContainerName} validator slashing-protection import --datadir=/files/slashing_protection.json`
    );
  });

  it("should migrate validator", async () => {
    // Run migration: https://docs.prylabs.network/docs/install/install-with-docker/#step-4-run-migration
  });

  after(async () => {
    // Remove validator container
    await shell(`docker-compose -f ${composePath} down`);
  });
});
