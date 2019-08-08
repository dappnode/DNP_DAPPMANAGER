const expect = require("chai").expect;
const db = require("db");
const params = require("params");

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day

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
  flagSuccessfulUpdate,
  unflagSuccessfulUpdate,
  isUpdateDelayCompleted,
  clearPendingUpdates,
  getRegistry,
  // String constants
  MY_PACKAGES,
  AUTO_UPDATE_SETTINGS,
  AUTO_UPDATE_REGISTRY
} = require("utils/autoUpdateHelper");

const name = "bitcoin.dnp.dappnode.eth";

describe("Util: autoUpdateHelper", () => {
  beforeEach("Make sure the autosettings are restarted", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, null);
    await db.set(AUTO_UPDATE_REGISTRY, null);
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });

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

  describe("Auto update registry", () => {
    it("Should flag a successful update in the registry and query it", async () => {
      const version1 = "0.2.5";
      const version2 = "0.2.6";
      const timestamp = 1563373272397;
      await flagSuccessfulUpdate(name, version1, timestamp);
      await flagSuccessfulUpdate(name, version2, timestamp);
      const registry = await getRegistry();
      expect(registry).to.deep.equal({
        [name]: {
          [version1]: { updated: timestamp },
          [version2]: { updated: timestamp }
        }
      });
    });

    it("Should remove an registry entry", async () => {
      // removeRegistryEntry;

      const version = "0.2.6";
      const timestamp = 1563373272397;
      await flagSuccessfulUpdate(name, version, timestamp);

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: { updated: timestamp }
          }
        },
        "Should have one entry"
      );

      // Remove entry
      await unflagSuccessfulUpdate(name, version);

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: { updated: null }
          }
        },
        "Entry should had been removed"
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

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: {
              firstSeen: timestamp,
              scheduledUpdate: timestamp + updateDelay
            }
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

      expect(await getRegistry()).to.deep.equal(
        {
          [name]: {
            [version]: {
              firstSeen: timestamp,
              scheduledUpdate: timestamp + updateDelay
            }
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
      await isUpdateDelayCompleted(name, version2, timestamp2);
      await flagSuccessfulUpdate(name, version2, timestamp2);

      expect(Object.keys((await getRegistry())[name])).to.deep.equal(
        [version, version2],
        "Should have one entry"
      );

      expect(await isUpdateDelayCompleted(name, version)).to.equal(
        true,
        "Should allow again because the delay is completed (24h)"
      );

      // Remove update entry. Test also that MY_PACKAGES removes this DNP
      await clearPendingUpdates(MY_PACKAGES);

      expect(Object.keys((await getRegistry())[name])).to.deep.equal(
        [version2],
        "Should have one entry removed the pending update entries"
      );

      expect(await isUpdateDelayCompleted(name, version)).to.equal(
        false,
        "Should not be allowed since the version is now removed"
      );
    });
  });

  after("Should reset all settings", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, null);
    await db.set(AUTO_UPDATE_REGISTRY, null);
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });
});
