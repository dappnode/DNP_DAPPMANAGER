import "mocha";
import { expect } from "chai";
import * as calls from "../../src/calls";
import { createTestDir } from "../testUtils";
import params from "../../src/params";
import shell from "../../src/utils/shell";
import {
  prepareDirectoryTypeRelease,
  prepareManifestTypeRelease,
  cleanInstallationArtifacts,
  verifyFiles,
  releaseDnpName,
  releaseVersion
} from "../testReleaseUtils";

/**
 * Generate mock releases in the different formats,
 * and try to retrieve and run them
 * - IPFS directory with docker-compose
 * - IPFS manifest, generate docker-compose from manifest
 */

/**
 * Aggregate the three type of tests
 * - Directory-type (with docker-compose)
 * - Manifest-type
 *
 * [NOTE] There are different default `NAME` env values
 * in the different files that each release typeis using
 */

const releaseTests: {
  name: string;
  prepareRelease: () => Promise<string>;
  envValue: string;
}[] = [
  {
    name: "Directory-type",
    prepareRelease: prepareDirectoryTypeRelease,
    envValue: "From_Compose"
  },
  {
    name: "Manifest-type",
    prepareRelease: prepareManifestTypeRelease,
    envValue: "Normal_Name"
  }
];

describe("Release format tests", () => {
  before("Create DAppNode docker network", async () => {
    const dncoreNetwork = params.DNP_NETWORK_EXTERNAL_NAME;
    const networkExists = await shell(
      `docker network ls --filter name=${dncoreNetwork} -q`
    );
    if (!networkExists) await shell(`docker network create ${dncoreNetwork}`);
  });

  for (const releaseTest of releaseTests) {
    describe(releaseTest.name, () => {
      let releaseHash: string;

      before(async () => {
        await createTestDir();
        await cleanInstallationArtifacts();
        verifyFiles();
      });

      it("Should generate mock release and upload it", async () => {
        releaseHash = await releaseTest.prepareRelease();
        console.log(`Uploaded mock: ${releaseTest.name}\n  ${releaseHash}`);
      }).timeout(60 * 1000);

      it("Get the release", async () => {
        if (!releaseHash) throw Error("Previous test failed");

        const result = await calls.fetchDnpRequest({ id: releaseHash });

        expect(result.dnpName).to.equal(releaseDnpName, "Wrong manifest name");
        expect(result.semVersion).to.equal(
          releaseVersion,
          "Wrong manifest version"
        );
      }).timeout(60 * 1000);

      it("Install the release", async () => {
        if (!releaseHash) throw Error("Previous test failed");

        await calls.packageInstall({
          name: releaseDnpName,
          version: releaseHash
          // userSetEnvs: { [releaseDnpName]: { NAME: nameEnv } }
        });

        // Verify it is running correctly
        const dnps = await calls.packagesGet();
        const dnp = dnps.find(d => d.dnpName === releaseDnpName);
        if (!dnp) throw Error(`DNP ${releaseDnpName} not found`);
        const container = dnp.containers[0];
        const result = await calls.packageLog({
          containerName: container.containerName
        });
        expect(result).to.include(
          `Hello, ${releaseTest.envValue}`,
          `Wrong log from ${releaseDnpName} after installation`
        );
      }).timeout(60 * 1000);

      after("Clean installation artifacts", async () => {
        await cleanInstallationArtifacts();
      });
    });
  }

  after("Remove DAppNode docker network", async () => {
    await shell(`docker network remove ${params.DNP_NETWORK_EXTERNAL_NAME}`);
  });
});
