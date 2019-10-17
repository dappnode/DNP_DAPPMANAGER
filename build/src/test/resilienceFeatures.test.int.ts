import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as getPath from "../src/utils/getPath";
import * as calls from "../src/calls";
import { createTestDir, mockManifestWithImage } from "./testUtils";
import params from "../src/params";
import shell from "../src/utils/shell";
import {
  prepareManifestTypeRelease,
  cleanInstallationArtifacts,
  verifyFiles,
  releaseDnpName,
  releaseVersion
} from "./testReleaseUtils";
import { getDnpFromListPackages } from "./testPackageUtils";

/**
 * Generate mock releases in the different formats,
 * and try to retrieve and run them
 * - IPFS directory with docker-compose
 * - IPFS directory generate docker-compose from manifest
 * - IPFS manifest, generate docker-compose from manifest
 */

/**
 * Aggregate the three type of tests
 * - Directory-type, WITH docker-compose
 * - Directory-type, NO docker-compose
 * - Manifest-type
 *
 * [NOTE] There are different default `NAME` env values
 * in the different files that each release typeis using
 */

describe("Resilience features, when things go wrong", function() {
  this.timeout(60 * 1000);
  let releaseHash: string;

  before("Create DAppNode docker network", async () => {
    const dncoreNetwork = params.DNP_NETWORK_EXTERNAL_NAME;
    const networkExists = await shell(
      `docker network ls --filter name=${dncoreNetwork} -q`
    );
    if (!networkExists) await shell(`docker network create ${dncoreNetwork}`);
  });

  before("Clean files", async () => {
    await createTestDir();
    await cleanInstallationArtifacts();
    verifyFiles();
  });

  before("Upload a vanilla package", async () => {
    releaseHash = await prepareManifestTypeRelease();
  });

  describe("Remove a package without compose", () => {
    before("Install the release", async () => {
      await calls.installPackage({
        id: [releaseDnpName, releaseHash].join("@")
      });
    });

    it("Remove the compose and then remove the package", async () => {
      const composePath = getPath.dockerCompose(releaseDnpName, false);
      fs.unlinkSync(composePath);
      await calls.removePackage({
        id: releaseDnpName,
        deleteVolumes: true,
        timeout: 0
      });
    }).timeout(60 * 1000);
  });

  describe("Remove a package with a broken compose", () => {
    before("Install the release", async () => {
      await calls.installPackage({
        id: [releaseDnpName, releaseHash].join("@")
      });
    });

    it("Break the compose and then remove the package", async () => {
      const composePath = getPath.dockerCompose(releaseDnpName, false);
      const composeString = fs.readFileSync(composePath, "utf8");
      fs.writeFileSync(composePath, composeString + "BROKEN");
      await calls.removePackage({
        id: releaseDnpName,
        deleteVolumes: true,
        timeout: 0
      });
    }).timeout(60 * 1000);
  });

  describe("Failing installation due to bad compose", () => {
    let brokenReleaseHash: string;
    before("Install the good release", async () => {
      await calls.installPackage({
        id: [releaseDnpName, releaseHash].join("@")
      });
    });

    before("Upload the bad release", async () => {
      brokenReleaseHash = await prepareManifestTypeRelease({
        ...mockManifestWithImage,
        name: releaseDnpName,
        version: releaseVersion,
        image: {
          ...mockManifestWithImage.image,
          // Intentional error to make the installation fail
          ports: ["0:0"]
        }
      });
    });

    it("Should do a rollback due to a broken compose", async () => {
      const dnpBefore = await getDnpFromListPackages(releaseDnpName);

      let errorMessage = "--did not throw--";
      try {
        await calls.installPackage({
          id: [releaseDnpName, brokenReleaseHash].join("@")
        });
      } catch (e) {
        errorMessage = e.message;
      }
      expect(errorMessage).to.include(
        `Cannot start service ${releaseDnpName}`,
        "Wrong error message"
      );

      const dnpAfter = await getDnpFromListPackages(releaseDnpName);

      if (!dnpBefore) throw Error("dnpBefore not found");
      if (!dnpAfter) throw Error("dnpAfter not found");

      expect(dnpBefore.origin).to.equal(
        releaseHash,
        "Origin must be the good release hash"
      );
      expect(dnpBefore.origin).to.equal(
        dnpAfter.origin,
        "Rollback should leave the before version running"
      );
    }).timeout(60 * 1000);
  });

  after("Clean installation artifacts", async () => {
    await cleanInstallationArtifacts();
  });
});
