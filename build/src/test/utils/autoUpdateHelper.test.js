const expect = require("chai").expect;
const db = require("db");
const params = require("params");
const { getCoreVersionId } = require("utils/coreVersionId");

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day
const coreDnpName = params.coreDnpName;

const {
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
  isUpdateDelayCompleted,
  getRegistry,
  // Pending updates
  getPending,
  getDnpFeedbackMessage,
  getCoreFeedbackMessage,
  // Utils
  getLastRegistryEntry,
  // String constants
  AUTO_UPDATE_SETTINGS,
  AUTO_UPDATE_REGISTRY,
  AUTO_UPDATE_PENDING
} = require("utils/autoUpdateHelper");

const name = "bitcoin.dnp.dappnode.eth";
const successful = true;

describe("Util: autoUpdateHelper", () => {
  beforeEach("Make sure the autosettings are restarted", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, null);
    await db.set(AUTO_UPDATE_REGISTRY, null);
    await db.set(AUTO_UPDATE_PENDING, null);
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });

  describe("Auto update settings", () => {
    it("Should set active for my packages", async () => {
      const check = name => isDnpUpdateEnabled(name);

      // Enable my-packages
      expect(await check()).to.equal(false, "Before enabling");
      await editDnpSetting(true);
      expect(await check()).to.equal(true, "After enabling");

      // Disable a single package
      expect(await check(name)).to.equal(true, "Before disabling name");
      await editDnpSetting(true, name);
      expect(await check(name)).to.equal(true, "Before disablingx2 name");
      await editDnpSetting(false, name);
      expect(await check(name)).to.equal(false, "After disabling name");
      await editDnpSetting(true, name);
      expect(await check(name)).to.equal(true, "After enabling name");

      // Disable my-packages
      await editDnpSetting(false);
      expect(await check()).to.equal(false, "After disabling");
      expect(await check(name)).to.equal(false, "After disabling name final");
    });

    it("Should set active for system packages", async () => {
      expect(await isCoreUpdateEnabled()).to.equal(false, "Before enabling");
      await editCoreSetting(true);
      expect(await isCoreUpdateEnabled()).to.equal(true, "After enabling");
      await editCoreSetting(false);
      expect(await isCoreUpdateEnabled()).to.equal(false, "After disabling");
    });
  });

  describe("Auto update registry", () => {
    it("Should flag a successful update in the registry and query it", async () => {
      const version1 = "0.2.5";
      const version2 = "0.2.6";
      const timestamp = 1563373272397;
      await flagCompletedUpdate(name, version1, successful, timestamp);
      await flagCompletedUpdate(name, version2, successful, timestamp);
      const registry = await getRegistry();
      expect(registry).to.deep.equal({
        [name]: {
          [version1]: { updated: timestamp, successful: true },
          [version2]: { updated: timestamp, successful: true }
        }
      });
    });

    it("Should flag an update as unsuccessful", async () => {
      // removeRegistryEntry;

      const version = "0.2.6";
      const timestamp = 1563373272397;
      await flagCompletedUpdate(name, version, successful, timestamp);

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: { updated: timestamp, successful: true }
          }
        },
        "Should have one entry"
      );

      // Remove entry
      const timestampLatter = timestamp + 12736;
      await flagCompletedUpdate(name, version, false, timestampLatter);

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: { updated: timestampLatter, successful: false }
          }
        },
        "Entry should be marked as unsuccessful"
      );
    });
  });

  describe("Auto update delay", () => {
    it("Should NOT allow the update if the delay is NOT completed", async () => {
      const version = "0.2.6";
      const timestamp = Date.now();
      expect(await isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(await getPending()).to.deep.equal(
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

      expect(await isUpdateDelayCompleted(name, version)).to.equal(
        false,
        "Should not allow again because the delay is not completed (24h)"
      );
    });

    it("Should allow the update if the delay is completed", async () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      expect(await isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(await getPending()).to.deep.equal(
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

      expect(await isUpdateDelayCompleted(name, version)).to.equal(
        true,
        "Should allow again because the delay is completed (24h)"
      );

      expect(await isUpdateDelayCompleted(name, version)).to.equal(
        true,
        "Should allow again, a second time after the delay is completed"
      );
    });

    it("Should clear pending updates", async () => {
      const version = "0.2.6";
      const timestamp = Date.now() - (updateDelay + 1);
      const version2 = "0.2.5";
      const timestamp2 = Date.now() - 2 * updateDelay;

      expect(await isUpdateDelayCompleted(name, version, timestamp)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(await getPending()).to.deep.equal(
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

      expect(await isUpdateDelayCompleted(name, version2, timestamp2)).to.equal(
        false,
        "Should not allow on first check"
      );

      expect(await getPending()).to.deep.equal(
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
  });

  describe("Feedback text for DNPs", () => {
    const id = "bitcoin.dnp.dappnode.eth";
    const currentVersion = "0.2.6";
    const nextVersion = "0.2.7";

    it("1. Nothing happened yet", async () => {
      const message = await getDnpFeedbackMessage({
        id,
        currentVersion,
        registry: {},
        pending: {}
      });
      expect(message).to.equal("-", "Message should be empty");
    });

    it("2. DNP is seen", async () => {
      const message = await getDnpFeedbackMessage({
        id,
        currentVersion,
        registry: {},
        pending: {
          [id]: {
            version: nextVersion,
            firstSeen: Date.now(),
            scheduledUpdate: Date.now() + 12.3 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(message).to.equal("Scheduled, in 12 hours");
    });

    it("3A. DNP is manually updated", async () => {
      const message = await getDnpFeedbackMessage({
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
      expect(message).to.equal("Manually updated");
    });

    it("3B. DNP is in queue", async () => {
      const message = await getDnpFeedbackMessage({
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
      expect(message).to.equal("In queue");
    });

    it("3B. DNP is successfully updated", async () => {
      const message = await getDnpFeedbackMessage({
        id,
        currentVersion: nextVersion,
        registry: {
          [id]: {
            [nextVersion]: {
              updated: Date.now(),
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
      expect(message).to.equal("Today, 0 min ago");
    });
  });

  describe("Feedback text for COREs", () => {
    const currentVersionId = getCoreVersionId([
      { name: "admin", version: "0.2.6" },
      { name: "vpn", version: "0.2.2" },
      { name: "core", version: "0.2.8" }
    ]);
    const id = coreDnpName;

    it("1. Nothing happened yet", async () => {
      const message = await getCoreFeedbackMessage({
        currentVersionId,
        registry: {},
        pending: {}
      });
      expect(message).to.equal("-", "Message should be empty");
    });

    it("2. Core update is seen", async () => {
      const message = await getCoreFeedbackMessage({
        currentVersionId,
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
      expect(message).to.equal("Scheduled, in 12 hours");
    });

    it("3A. Core is manually updated", async () => {
      const message = await getCoreFeedbackMessage({
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
      expect(message).to.equal("Manually updated");
    });

    it("3B. Core is successfully updated", async () => {
      const nextVersion = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const currentVersionId = getCoreVersionId([
        { name: "admin", version: "0.2.1" },
        { name: "vpn", version: "0.2.1" },
        { name: "core", version: "0.2.1" }
      ]);
      const message = await getCoreFeedbackMessage({
        currentVersionId,
        registry: {
          [id]: {
            [nextVersion]: { updated: Date.now(), successful: true }
          }
        },
        pending: {
          [id]: {
            version: nextVersion,
            firstSeen: Date.now(),
            scheduledUpdate: Date.now() + 12.3 * 60 * 60 * 1000,
            completedDelay: false
          }
        }
      });
      expect(message).to.equal("Today, 0 min ago");
    });

    it("X. Core full lifecycle", async () => {
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
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.equal("-", "1. Should be empty");

      await isUpdateDelayCompleted(
        coreDnpName,
        nextVersionId,
        Date.now() - (24 * 60 * 60 * 1000 - microDelay)
      );

      expect(
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.equal("Scheduled, in 0 minutes", "2. Should be scheduled");

      await new Promise(r => setTimeout(r, 2 * microDelay));

      expect(
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdBefore
        })
      ).to.equal("In queue", "3. Should be in queue");

      expect(
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.equal("Manually updated", "3A. Should be manually updated");

      await flagCompletedUpdate(coreDnpName, nextVersionId, true);

      expect(
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.equal("Today, 0 min ago", "3B. Should be completed");

      await isUpdateDelayCompleted(
        coreDnpName,
        nextVersion2Id,
        Date.now() - (24 * 60 * 60 * 1000 - microDelay)
      );

      expect(
        await getCoreFeedbackMessage({
          currentVersionId: currentVersionIdAfter
        })
      ).to.equal("Scheduled, in 0 minutes", "4. Start again");
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
  });

  after("Should reset all settings", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, null);
    await db.set(AUTO_UPDATE_REGISTRY, null);
    await db.set(AUTO_UPDATE_PENDING, null);
  });
});
