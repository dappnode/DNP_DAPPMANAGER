import "mocha";
import { expect } from "chai";
import fs from "fs";
import * as calls from "../../src/calls/index.js";
import {
  createTestDir,
  beforeAndAfter,
  cleanRepos,
  cleanContainers,
  shellSafe
} from "../testUtils.js";
import { params } from "@dappnode/params";
import { getDnpFromListPackages } from "./testPackageUtils.js";
import { cleanInstallationArtifacts } from "./integrationSpecs/index.js";
import { getDockerComposePath } from "@dappnode/utils";

describe("Resilience features, when things go wrong", function () {
  const testMockPrefix = "testmock-";
  const dnpName = testMockPrefix + "resilience-features.dnp.dappnode.eth";
  let releaseHash: string;
  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;

  beforeAndAfter("Clean files", async () => {
    await createTestDir();
    await cleanInstallationArtifacts(testMockPrefix);
  });

  before("Create DAppNode docker network", async () => {
    const networkExists = await shellSafe(
      `docker network ls --filter name=${dncoreNetwork} -q`
    );
    if (!networkExists)
      await shellSafe(`docker network create ${dncoreNetwork}`);
  });

  after("Remove dncore_network", async () => {
    await shellSafe(`docker network rm ${dncoreNetwork}`);
  });

  afterEach("Clean environment", async () => {
    // SUPER important to clean dnp_repo folder to avoid caches
    await cleanRepos();
    await cleanContainers(dnpName);
  });

  describe("Signed safe restrictions", () => {
    it("Prevent installing package from unsafe origin not signed", async () => {
      try {
        await calls.packageInstall({
          name: dnpName,
          version: releaseHash
        });
        throw Error("Should prevent installation");
      } catch (e) {
        if (
          (e as Error).message.includes(
            `Package ${dnpName} is from untrusted origin and is not signed`
          )
        ) {
          // OK, expected error
        } else {
          throw e;
        }
      }
    });
  });

  describe("Remove a package without compose", () => {
    before("Install the release", async () => {
      await calls.packageInstall({
        name: dnpName,
        version: releaseHash,
        options: { BYPASS_SIGNED_RESTRICTION: true }
      });
    });

    it("Remove the compose and then remove the package", async () => {
      const composePath = getDockerComposePath(dnpName, false);
      fs.unlinkSync(composePath);
      await calls.packageRemove({ dnpName, deleteVolumes: true });
    });
  });

  describe("Remove a package with a broken compose", () => {
    before("Install the release", async () => {
      await calls.packageInstall({
        name: dnpName,
        version: releaseHash,
        options: { BYPASS_SIGNED_RESTRICTION: true }
      });
    });

    it("Break the compose and then remove the package", async () => {
      const composePath = getDockerComposePath(dnpName, false);
      const composeString = fs.readFileSync(composePath, "utf8");
      fs.writeFileSync(composePath, composeString + "BROKEN");
      await calls.packageRemove({ dnpName, deleteVolumes: true });
    });
  });

  describe("Failing installation due to bad compose", () => {
    let brokenReleaseHash: string;
    before("Install the good release", async () => {
      await calls.packageInstall({
        name: dnpName,
        version: releaseHash,
        options: { BYPASS_SIGNED_RESTRICTION: true }
      });
    });

    it("Should do a rollback due to a broken compose", async () => {
      const dnpBefore = await getDnpFromListPackages(dnpName);

      let errorMessage = "--did not throw--";
      try {
        await calls.packageInstall({
          name: dnpName,
          version: brokenReleaseHash,
          options: { BYPASS_SIGNED_RESTRICTION: true }
        });
      } catch (e) {
        errorMessage = e.message;
      }
      expect(errorMessage).to.include(
        `Cannot start service ${dnpName}`,
        "Wrong error message"
      );

      const dnpAfter = await getDnpFromListPackages(dnpName);

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
    });
  });
});
