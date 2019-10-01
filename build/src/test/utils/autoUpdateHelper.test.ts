import "mocha";
import { expect } from "chai";
import params from "../../src/params";
import { getCoreVersionId } from "../../src/utils/coreVersionId";

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
} from "../../src/utils/autoUpdateHelper";
import { clearDbs } from "../testUtils";

const name = "bitcoin.dnp.dappnode.eth";

describe("Util: autoUpdateHelper", () => {
  beforeEach("Make sure the autosettings are restarted", () => {
    clearDbs();
    expect(getSettings()).to.deep.equal({}, "autoUpdateSettings are not empty");
  });

  describe("Auto update settings", () => {
    it("Should set active for my packages", () => {
      const check = (): boolean => isDnpUpdateEnabled(name);

      // Enable my-packages
      expect(check()).to.equal(false, "Before enabling");
      editDnpSetting(true);
      expect(check()).to.equal(true, "After enabling");

      // Disable a single package
      expect(check()).to.equal(true, "Before disabling name");
      editDnpSetting(true, name);
      expect(check()).to.equal(true, "Before disablingx2 name");
      editDnpSetting(false, name);
      expect(check()).to.equal(false, "After disabling name");
      editDnpSetting(true, name);
      expect(check()).to.equal(true, "After enabling name");

      // Disable my-packages
      editDnpSetting(false);
      expect(check()).to.equal(false, "After disabling");
      expect(check()).to.equal(false, "After disabling name final");
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
      flagCompletedUpdate(name, version1, timestamp);
      flagCompletedUpdate(name, version2, timestamp);
      const registry = getRegistry();
      expect(registry).to.deep.equal({
        [name]: {
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
      expect(isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [name]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(name, version)).to.equal(
        false,
        "Should not allow again because the delay is not completed (24h)"
      );
    });

    it("Should allow the update if the delay is completed", () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      expect(isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [name]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(name, version)).to.equal(
        true,
        "Should allow again because the delay is completed (24h)"
      );

      expect(isUpdateDelayCompleted(name, version)).to.equal(
        true,
        "Should allow again, a second time after the delay is completed"
      );
    });

    it("Should clear pending updates", () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      const version2 = "0.2.5";
      const timestamp2 = Date.now() - 2 * updateDelay;

      expect(isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [name]: {
            version,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Should have one entry with firstSeen set"
      );

      expect(isUpdateDelayCompleted(name, version2, timestamp2)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(getPending()).to.deep.equal(
        {
          [name]: {
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
      isUpdateDelayCompleted(name, version, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [name]: {
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
      flagErrorUpdate(name, errorMessage);

      expect(getPending()).to.deep.equal(
        {
          [name]: {
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
    const id = "bitcoin.dnp.dappnode.eth";
    const currentVersion = "0.2.6";
    const nextVersion = "0.2.7";

    it("1. Nothing happened yet", () => {
      const feedback = getDnpFeedbackMessage({
        id,
        currentVersion,
        registry: {},
        pending: {}
      });
      expect(feedback).to.deep.equal({}, "Message should be empty");
    });

    it("2. DNP is seen", () => {
      const timestamp = Date.now() + 12.3 * 60 * 60 * 1000;
      const feedback = getDnpFeedbackMessage({
        id,
        currentVersion,
        registry: {},
        pending: {
          [id]: {
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
        id,
        currentVersion: nextVersion,
        registry: {},
        pending: {
          [id]: {
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
        id,
        currentVersion,
        registry: {},
        pending: {
          [id]: {
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
        id,
        currentVersion: nextVersion,
        registry: {
          [id]: {
            [nextVersion]: {
              updated: timestamp,
              successful: true
            }
          }
        },
        pending: {
          [id]: {
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
        id,
        currentVersion,
        registry: {},
        pending: {
          [id]: {
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
      const swarmId = "swarm.dnp.dappnode.eth";
      const timestamp = Date.now() + 23.3 * 60 * 60 * 1000;
      const feedback = getDnpFeedbackMessage({
        id: swarmId,
        currentVersion: "0.2.1",
        registry: {
          [swarmId]: {
            "0.2.1": { updated: 1566058824278, successful: true },
            "0.2.2": { updated: 1566140083139, successful: true }
          }
        },
        pending: {
          [swarmId]: {
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
    const currentVersionId = getCoreVersionId([
      { name: "admin", version: "0.2.0" },
      { name: "vpn", version: "0.2.1" },
      { name: "core", version: "0.2.0" }
    ]);
    const id = coreDnpName;

    it("1. Nothing happened yet", () => {
      const feedback = getCoreFeedbackMessage({
        currentVersionId,
        registry: {},
        pending: {}
      });
      expect(feedback).to.deep.equal({}, "Message should be empty");
    });

    it("2. Core update is seen", () => {
      const timestamp = Date.now() + 12.3 * 60 * 60 * 1000;
      const feedback = getCoreFeedbackMessage({
        currentVersionId,
        registry: {},
        pending: {
          [id]: {
            version: getCoreVersionId([
              { name: "admin", version: "0.2.1" },
              { name: "core", version: "0.2.1" }
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
      const feedback = getCoreFeedbackMessage({
        currentVersionId: getCoreVersionId([
          { name: "admin", version: "0.2.1" },
          { name: "vpn", version: "0.2.1" },
          { name: "core", version: "0.2.1" }
        ]),
        registry: {},
        pending: {
          [id]: {
            version: getCoreVersionId([
              { name: "admin", version: "0.2.1" },
              { name: "core", version: "0.2.1" }
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
      const nextVersion = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const currentVersionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "vpn", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const feedback = getCoreFeedbackMessage({
        currentVersionId,
        registry: {
          [id]: {
            [nextVersion]: { updated: timestamp, successful: true }
          }
        },
        pending: {}
      });
      expect(feedback).to.deep.equal({ updated: timestamp });
    });

    it("3C. Core update failed", () => {
      const errorMessage = "Mainnet is still syncing";
      const feedback = getCoreFeedbackMessage({
        currentVersionId,
        registry: {},
        pending: {
          [id]: {
            version: getCoreVersionId([
              { name: "admin", version: "0.2.1" },
              { name: "core", version: "0.2.1" }
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
      const currentVersionIdBefore = getCoreVersionId([
        { name: "admin", version: "0.2.0" },
        { name: "vpn", version: "0.2.0" },
        { name: "core", version: "0.2.0" }
      ]);
      const nextVersionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const currentVersionIdAfter = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "vpn", version: "0.2.0" },
        { name: "core", version: "0.2.1" }
      ]);
      const nextVersion2Id = getCoreVersionId([
        { name: "admin", version: "0.2.2" },
        { name: "core", version: "0.2.2" }
      ]);
      const microDelay = 5;

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.deep.equal({}, "1. Should be empty");

      const timestampIsUpdated =
        Date.now() - (24 * 60 * 60 * 1000 - microDelay);
      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestampIsUpdated);

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.deep.equal(
        { scheduled: timestampIsUpdated + updateDelay },
        "2. Should be scheduled"
      );

      await new Promise(
        (r): void => {
          setTimeout(r, 2 * microDelay);
        }
      );

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.deep.equal({ inQueue: true }, "3. Should be in queue");

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.deep.equal(
        { manuallyUpdated: true },
        "3A. Should be manually updated"
      );

      const timestampIsCompleted = Date.now();
      flagCompletedUpdate(coreDnpName, nextVersionId, timestampIsCompleted);

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.deep.equal(
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

      expect(
        getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.deep.equal(
        { scheduled: timestampIsCompletedNext + updateDelay },
        "4. Start again"
      );
    });
  });

  describe("DAPPMANAGER update patch measures", () => {
    it("Should clear complete core updates if update was completed", () => {
      const id = coreDnpName;
      const timestamp = Date.now();
      const versionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "vpn", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const nextVersionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);

      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [id]: {
            version: nextVersionId,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Core update should be pending"
      );

      clearCompletedCoreUpdatesIfAny(versionId, timestamp);

      expect(getPending()).to.deep.equal(
        {},
        "Pending version should be removed"
      );

      expect(getRegistry()).to.deep.equal(
        {
          [id]: {
            [nextVersionId]: { updated: timestamp, successful: true }
          }
        },
        "A new registry entry should be added"
      );
    });

    it("Should NOT clear complete core updates if update was NOT completed", () => {
      const id = coreDnpName;
      const timestamp = Date.now();
      const versionId = getCoreVersionId([
        { name: "admin", version: "0.2.0" },
        { name: "vpn", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const nextVersionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);

      isUpdateDelayCompleted(coreDnpName, nextVersionId, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [id]: {
            version: nextVersionId,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + updateDelay,
            completedDelay: false
          }
        },
        "Core update should be pending"
      );

      clearCompletedCoreUpdatesIfAny(versionId, timestamp);

      expect(getPending()).to.deep.equal(
        {
          [id]: {
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
