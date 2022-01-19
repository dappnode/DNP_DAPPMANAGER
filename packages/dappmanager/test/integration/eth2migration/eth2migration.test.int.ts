import "mocha";
import { expect } from "chai";
import shell from "../../../src/utils/shell";
import { shellSafe } from "../../testUtils";
import { eth2Migrate } from "../../../src/modules/eth2migration";
import params from "../../../src/params";
import {
  dappmanagerOutPaths,
  outputVolumeName
} from "../../../src/modules/eth2migration/export/params";
import fs from "fs";

describe.only("eth2migrations", function () {
  const prysmComposePath = `${__dirname}/DAppNodePackage-prysm-prater/docker-compose.yml`;
  const web3signerComposePath = `${__dirname}/DAppNodePackage-teku-prater/docker-compose.yml`;
  const tekuComposePath = `${__dirname}/DAppNodePackage-web3signer-prater/docker-compose.yml`;

  /**
   * Create dappmanager volume
   */
  /*   before(() => {
    fs.mkdirSync(dappmanagerOutPaths.outVolumeTarget, { recursive: true });
  }); */

  before(async () => {
    // Create necessary network
    await shellSafe("docker network create dncore_network");
  });

  /**
   * Get docker images needed
   */
  before(async () => {
    await shell(`docker pull consensys/teku:22.1.0`);
    await shell(`docker pull consensys/web3signer:21.10.5`);
    await shell(`docker pull postgres:14.1-bullseye`);
    await shell(`docker pull alpine`);
  });

  /**
   * Set-up prysm validator, teku and web3signer and dappmanager
   */
  before(async () => {
    await shell(`docker-compose -f ${prysmComposePath} up -d`);
    await shell(`docker-compose -f ${tekuComposePath} up -d`);
    await shell(`docker-compose -f ${web3signerComposePath} up -d`);
    await shell(
      `docker run --network=dncore_network -d --name=${params.dappmanagerDnpName} \
--volume=${outputVolumeName}:${dappmanagerOutPaths.outVolumeTarget} alpine`
    );
  });

  it("should migrate validator", async () => {
    // Run migration: https://docs.prylabs.network/docs/install/install-with-docker/#step-4-run-migration
    await eth2Migrate({
      client: "teku",
      network: "prater"
    });
  });

  /*   after(() => {
    fs.rmdirSync(dappmanagerOutPaths.outVolumeTarget, { recursive: false });
  }); */

  /**
   * Compose down all packages
   */
  after(async () => {
    await shell(`docker-compose -f ${prysmComposePath} down -v`);
    await shell(`docker-compose -f ${web3signerComposePath} down -v`);
    await shell(`docker-compose -f ${tekuComposePath} down -v`);
    await shell(`docker rm ${params.dappmanagerDnpName}`);
    await shell(`docker volume rm ${outputVolumeName}`);
  });

  /**
   * Remove dncore_network
   */
  after(async () => {
    await shell(`docker network rm dncore_network`);
  });
});
