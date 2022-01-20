import "mocha";
import fs from "fs";
import shell from "../../../src/utils/shell";
import { shellSafe } from "../../testUtils";
import { eth2Migrate } from "../../../src/modules/eth2migration";
import params from "../../../src/params";
import {
  dappmanagerOutPaths,
  outputVolumeName
} from "../../../src/modules/eth2migration/export/params";
import { imagesList } from "../../../src/modules/docker";

const imagesToPull = [
  "consensys/teku:22.1.0",
  "consensys/web3signer:21.10.5",
  "postgres:14.1-bullseye",
  "alpine:latest"
];

describe("eth2migrations", function () {
  const prysmComposePath = `${__dirname}/DAppNodePackage-prysm-prater/docker-compose.yml`;
  const tekuComposePath = `${__dirname}/DAppNodePackage-teku-prater/docker-compose.yml`;
  const web3signerComposePath = `${__dirname}/DAppNodePackage-web3signer-prater/docker-compose.yml`;

  before("Create dappmanager volume target", () => {
    if (dappmanagerOutPaths.outVolumeTarget.startsWith("/usr/src/app")) {
      throw Error(
        "MUST run this test with ENV TEST=true to prevent modifying your system's directories"
      );
    }

    fs.mkdirSync(dappmanagerOutPaths.outVolumeTarget, { recursive: true });
  });

  before("Create dncore_network", async () => {
    await shellSafe("docker network create dncore_network");
  });

  before("pull docker images needed", async () => {
    const tags = new Set<string>();
    const images = await imagesList();
    for (const image of images) {
      for (const tag of image.RepoTags) {
        tags.add(tag);
      }
    }

    for (const imageToPull of imagesToPull) {
      if (!tags.has(imageToPull)) {
        console.log(`Pulling image ${imageToPull}`);
        await shell(`docker pull consensys/teku:22.1.0`);
        console.log(`Pulled image ${imageToPull}`);
      }
    }
  });

  before(
    "Set-up prysm validator, teku and web3signer and dappmanager",
    async () => {
      console.log("docker-compose up containers start");
      await shell(`docker-compose -f ${prysmComposePath} up -d`);
      await shell(`docker-compose -f ${tekuComposePath} up -d`);
      await shell(`docker-compose -f ${web3signerComposePath} up -d`);
      console.log("docker-compose up containers done");

      // create manualy docker volume: docker volume create.... with the needed driver settings
      await shell(`docker volume create -d local --name=${outputVolumeName}\
    --opt device="${dappmanagerOutPaths.outVolumeTarget}" \
    --opt type="none" \
    --opt o="bind"`);

      await shell(
        `docker run --network=dncore_network -d --name=${params.dappmanagerDnpName} \
--volume=${outputVolumeName}:${dappmanagerOutPaths.outVolumeTarget} alpine`
      );
    }
  );

  it("should migrate validator", async function () {
    this.timeout(240 * 1000);
    // Run migration: https://docs.prylabs.network/docs/install/install-with-docker/#step-4-run-migration
    await eth2Migrate({
      client: "teku",
      network: "prater"
    });
  });

  after("cleanup", async () => {
    // Compose down all packages
    await shell(`docker-compose -f ${prysmComposePath} down -v`);
    await shell(`docker-compose -f ${web3signerComposePath} down -v`);
    await shell(`docker-compose -f ${tekuComposePath} down -v`);
    await shell(`docker rm ${params.dappmanagerDnpName}`);
    await shell(`docker volume rm ${outputVolumeName}`);

    // Remove dncore_network
    await shellSafe(`docker network rm dncore_network`);

    // Clean up docker volume
    if (!dappmanagerOutPaths.outVolumeTarget.startsWith("/usr/src/app")) {
      fs.rmdirSync(dappmanagerOutPaths.outVolumeTarget, { recursive: true });
    }
  });
});
