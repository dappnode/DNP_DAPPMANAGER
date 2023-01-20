import "mocha";
import { expect } from "chai";
import params from "../../../src/params.js";
import { getCoreVersionId } from "../../../src/utils/coreVersionId.js";

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day
const coreDnpName = params.coreDnpName;

import {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  getSettings,
  // To keep a registry of performed updates
  // + Enforce a delay before auto-updating
  flagCompletedUpdate,
  flagErrorUpdate,
  isUpdateDelayCompleted,
  clearPendingUpdates,
  clearCompletedCoreUpdatesIfAny,
  getRegistry,
  // Pending updates
  getPending,
  getDnpFeedbackMessage,
  getCoreFeedbackMessage,
  // Utils
  getLastRegistryEntry
} from "../../../src/utils/autoUpdateHelper.js";
import { clearDbs, createTestDir } from "../../testUtils.js";

const dnpName = "bitcoin.dnp.dappnode.eth";

describe("Util: autoUpdateHelper", () => {
  before(async () => {
    await createTestDir();
  });

  beforeEach("Make sure the autosettings are restarted", async () => {
    clearDbs();
    expect(getSettings()).to.deep.equal({}, "autoUpdateSettings are not empty");
  });

  describe("Auto update settings", () => {
    it("Should set active for my packages", () => {
      const check = (): boolean => isDnpUpdateEnabled(dnpName);

      // Enable my-packages
      expect(check()).to.equal(false, "Before enabling");
      editDnpSetting(true);
      expect(check()).to.equal(true, "After enabling");

      // Disable a single package
      expect(check()).to.equal(true, `Before disabling ${dnpName}`);
      editDnpSetting(true, dnpName);
      expect(check()).to.equal(true, `Before disablingx2 ${dnpName}`);
      editDnpSetting(false, dnpName);
      expect(check()).to.equal(false, `After disabling ${dnpName}`);
      editDnpSetting(true, dnpName);
      expect(check()).to.equal(true, `After enabling ${dnpName}`);

      // Disable my-packages
      editDnpSetting(false);
      expect(check()).to.equal(false, "After disabling");
      expect(check()).to.equal(false, `After disabling ${dnpName} final`);
    });

    it("Should set active for system packages", () => {
      expect(isCoreUpdateEnabled()).to.equal(false, "Before enabling");
      editCoreSetting(true);
      expect(isCoreUpdateEnabled()).to.equal(true, "After enabling");
      editCoreSetting(false);
      expect(isCoreUpdateEnabled()).to.equal(false, "After disabling");
    });
  });

  describe("Auto update registry", () => {
    it("Should flag a successful update in the registry and query it", () => {
      const version1 = "0.2.5";
      const version2 = "0.2.6";
      const timestamp = 1563373272397;
      flagCompletedUpdate(dnpName, version1, timestamp);
      flagCompletedUpdate(dnpName, version2, timestamp);
      const registry = getRegistry();
      expect(registry).to.deep.equal({
        [dnpName]: {
          [version1]: { updated: timestamp, successful: true },
          [version2]: { updated: timestamp, successful: true }
        }
      });
    });
  });

  describe("Auto update delay", () => {
    it("Should NOT allow the update if the delay is NOT completed", () => {
      const version = "0.2.6";
      const timestamp = Date.now();
      expect(isUpdateDelayCompleted(dnpName, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(dnpName, version)).to.equal(
        false,
        "Should not allow again because the delay is not completed (24h)"
      );
    });

    it("Should allow the update if the delay is completed", () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      expect(isUpdateDelayCompleted(dnpName, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(dnpName, version)).to.equal(
        true,
        "Should allow again because the delay is completed (24h)"
      );

      expect(isUpdateDelayCompleted(dnpName, version)).to.equal(
        true,
        "Should allow again, a second time after the delay is completed"
      );
    });

    it("Should clear pending updates", () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      const version2 = "0.2.5";
      const timestamp2 = Date.now() - 2 * updateDelay;

      expect(isUpdateDelayCompleted(dnpName, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(dnpName, version2, timestamp2)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version: version2,
            firstSeen: timestamp2,
            scheduledUpdate: timestamp2 + updateDelay,
            completedDelay: false
          }
        },
        "Should have deleted the previous entry and changed for the second one"
      );
    });

    it("Should flag an update as unsuccessful", () => {
      // removeRegistryEntry;

      const version = "0.2.6";
      const timestamp = 1563373272397;
      isUpdateDelayCompleted(dnpName, version, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have a pending state"
      );

      // Simulation update Error
      const errorMessage = "Mainnet is still thinking";
      flagErrorUpdate(dnpName, errorMessage);

      expect(getPending()).to.deep.equal(
        {
          [dnpName]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false,
            errorMessage
          }
        },
        "Pending should contain an error message"
      );
    });
  });

  describe("Feedback text for DNPs", () => {
    const dnpName = "bitcoin.dnp.dappnode.eth";
    const currentVersion = "0.2.6";
    const nextVersion = "0.2.7";

    it("1. Nothing happened yet", () => {
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion,
        registry: {},
        pending: {}
      });
      expect(feedback).to.deep.equal({}, "Message should be empty");
    });

    it("2. DNP is seen", () => {
      const timestamp = Date.now() + 12.3 * 60 * 60 * 1000;
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion,
        registry: {},
        pending: {
          [dnpName]: {
            version: nextVersion,
            firstSeen: Date.now(),
            scheduledUpdate: timestamp,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ scheduled: timestamp });
    });

    it("3A. DNP is manually updated", () => {
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion: nextVersion,
        registry: {},
        pending: {
          [dnpName]: {
            version: nextVersion,
            firstSeen: Date.now() - 24.3 * 60 * 60 * 1000,
            scheduledUpdate: Date.now() - 12.3 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ manuallyUpdated: true });
    });

    it("3B. DNP is in queue", () => {
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion,
        registry: {},
        pending: {
          [dnpName]: {
            version: nextVersion,
            firstSeen: Date.now() - 24.3 * 60 * 60 * 1000,
            scheduledUpdate: Date.now() - 12.3 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ inQueue: true });
    });

    it("3B. DNP is successfully updated", () => {
      const timestamp = Date.now();
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion: nextVersion,
        registry: {
          [dnpName]: {
            [nextVersion]: {
              updated: timestamp,
              successful: true
            }
          }
        },
        pending: {
          [dnpName]: {
            version: nextVersion,
            firstSeen: Date.now() - 24 * 60 * 60 * 1000,
            scheduledUpdate: Date.now() - 12 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ updated: timestamp });
    });

    it("3C. DNP update failed", () => {
      const errorMessage = "Mainnet is still syncing";
      const feedback = getDnpFeedbackMessage({
        dnpName,
        currentVersion,
        registry: {},
        pending: {
          [dnpName]: {
            version: nextVersion,
            firstSeen: Date.now() - 24.3 * 60 * 60 * 1000,
            scheduledUpdate: Date.now() - 0.3 * 60 * 60 * 1000,
            completedDelay: false,
            errorMessage
          }
        }
      });
      expect(feedback).to.deep.equal({ inQueue: true, errorMessage });
    });

    it("Swarm logic bug for rollback versions", () => {
      const swarmDnpName = "swarm.dnp.dappnode.eth";
      const timestamp = Date.now() + 23.3 * 60 * 60 * 1000;
      const feedback = getDnpFeedbackMessage({
        dnpName: swarmDnpName,
        currentVersion: "0.2.1",
        registry: {
          [swarmDnpName]: {
            "0.2.1": { updated: 1566058824278, successful: true },
            "0.2.2": { updated: 1566140083139, successful: true }
          }
        },
        pending: {
          [swarmDnpName]: {
            version: "0.2.2",
            firstSeen: timestamp - 24 * 60 * 60 * 1000,
            scheduledUpdate: timestamp,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ scheduled: timestamp });
    });
  });

  describe("Feedback text for COREs", () => {
    const currentCorePackages = [
      { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" },
      { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.1" },
      { dnpName: "core.dnp.dappnode.eth", version: "0.2.0" }
    ];
    const currentCorePackagesAfter = [
      { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
      { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.1" },
      { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
    ];

    it("1. Nothing happened yet", () => {
      const feedback = getCoreFeedbackMessage(currentCorePackages, {
        registry: {},
        pending: {}
      });
      expect(feedback).to.deep.equal({}, "Message should be empty");
    });

    it("2. Core update is seen", () => {
      const timestamp = Date.now() + 12.3 * 60 * 60 * 1000;
      const feedback = getCoreFeedbackMessage(currentCorePackages, {
        registry: {},
        pending: {
          [coreDnpName]: {
            version: getCoreVersionId([
              { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
              { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
            ]),
            firstSeen: Date.now(),
            scheduledUpdate: timestamp,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ scheduled: timestamp });
    });

    it("3A. Core is manually updated", () => {
      const feedback = getCoreFeedbackMessage(currentCorePackagesAfter, {
        registry: {},
        pending: {
          [coreDnpName]: {
            version: getCoreVersionId([
              { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
              { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
            ]),
            firstSeen: Date.now(),
            scheduledUpdate: Date.now() + 12.3 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(feedback).to.deep.equal({ manuallyUpdated: true });
    });

    it("3B. Core is successfully updated", () => {
      const timestamp = Date.now();
      const currentCorePackages = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ];
      const nextVersion = getCoreVersionId([
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ]);
      const feedback = getCoreFeedbackMessage(currentCorePackages, {
        registry: {
          [coreDnpName]: {
            [nextVersion]: { updated: timestamp, successful: true }
          }
        },
        pending: {}
      });
      expect(feedback).to.deep.equal({ updated: timestamp });
    });

    it("3C. Core update failed", () => {
      const errorMessage = "Mainnet is still syncing";
      const feedback = getCoreFeedbackMessage(currentCorePackages, {
        registry: {},
        pending: {
          [coreDnpName]: {
            version: getCoreVersionId([
              { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
              { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
            ]),
            firstSeen: Date.now() - 24.3 * 60 * 60 * 1000,
            scheduledUpdate: Date.now() - 0.3 * 60 * 60 * 1000,
            completedDelay: false,
            errorMessage
          }
        }
      });
      expect(feedback).to.deep.equal({ inQueue: true, errorMessage });
    });

    it("1 -> 4. Core full lifecycle", async () => {
      const currentCorePackagesBefore = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.0" }
      ];
      const nextVersionId = getCoreVersionId([
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ]);
      const currentCorePackagesAfter = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ];
      const nextVersion2Id = getCoreVersionId([
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.2" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.2" }
      ]);
      const microDelay = 20;

      expect(getCoreFeedbackMessage(currentCorePackagesBefore)).to.deep.equal(
        {},
        "1. Should be empty"
      );

      const timestampIsUpdated =
        Date.now() - (24 * 60 * 60 * 1000 - microDelay);
      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestampIsUpdated);

      expect(getCoreFeedbackMessage(currentCorePackagesBefore)).to.deep.equal(
        { scheduled: timestampIsUpdated + updateDelay },
        "2. Should be scheduled"
      );

      await new Promise((r): void => {
        setTimeout(r, 2 * microDelay);
      });

      expect(getCoreFeedbackMessage(currentCorePackagesBefore)).to.deep.equal(
        { inQueue: true },
        "3. Should be in queue"
      );

      expect(getCoreFeedbackMessage(currentCorePackagesAfter)).to.deep.equal(
        { manuallyUpdated: true },
        "3A. Should be manually updated"
      );

      const timestampIsCompleted = Date.now();
      flagCompletedUpdate(coreDnpName, nextVersionId, timestampIsCompleted);

      expect(getCoreFeedbackMessage(currentCorePackagesAfter)).to.deep.equal(
        { updated: timestampIsCompleted },
        "3B. Should be completed"
      );

      const timestampIsCompletedNext =
        Date.now() - (24 * 60 * 60 * 1000 - microDelay);
      isUpdateDelayCompleted(
        coreDnpName,
        nextVersion2Id,
        timestampIsCompletedNext
      );

      expect(getCoreFeedbackMessage(currentCorePackagesAfter)).to.deep.equal(
        { scheduled: timestampIsCompletedNext + updateDelay },
        "4. Start again"
      );
    });
  });

  describe("DAPPMANAGER update patch measures", () => {
    it("Should clear complete core updates if update was completed", () => {
      const timestamp = Date.now();
      const currentCorePackages = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ];
      const nextVersionId = getCoreVersionId([
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ]);

      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [coreDnpName]: {
            version: nextVersionId,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Core update should be pending"
      );

      clearCompletedCoreUpdatesIfAny(currentCorePackages, timestamp);

      expect(getPending()).to.deep.equal(
        {},
        "Pending version should be removed"
      );

      expect(getRegistry()).to.deep.equal(
        {
          [coreDnpName]: {
            [nextVersionId]: { updated: timestamp, successful: true }
          }
        },
        "A new registry entry should be added"
      );
    });

    it("Should NOT clear complete core updates if update was NOT completed", () => {
      const timestamp = Date.now();
      const currentCorePackages = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ];
      const nextVersionId = getCoreVersionId([
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.1" }
      ]);

      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [coreDnpName]: {
            version: nextVersionId,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Core update should be pending"
      );

      clearCompletedCoreUpdatesIfAny(currentCorePackages, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [coreDnpName]: {
            version: nextVersionId,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Pending version should still be there"
      );

      expect(getRegistry()).to.deep.equal(
        {},
        "Registry should be empty, no new version added"
      );
    });
  });

  describe("Utils", () => {
    describe("getLastRegistryEntry", () => {
      it("Should get the last registry entry by updated time", () => {
        const registryDnp = {
          "0.2.4": { updated: 1560000000011, successful: true },
          "0.2.5": { updated: 1560000000033, successful: true },
          "0.2.6": { updated: 1560000000022, successful: true }
        };
        const lastEntry = {
          version: "0.2.5",
          updated: 1560000000033,
          successful: true
        };
        expect(getLastRegistryEntry(registryDnp)).to.deep.equal(lastEntry);
      });

      it("Should tolerate an empty object", () => {
        const registryDnp = {};
        const lastEntry = {};
        expect(getLastRegistryEntry(registryDnp)).to.deep.equal(lastEntry);
      });
    });

    describe("clearPendingUpdates", () => {
      it("Should not throw for unknown keys", () => {
        clearPendingUpdates("asdasd");
      });
    });
  });

  after("Should reset all settings", () => {
    clearDbs();
  });
});
