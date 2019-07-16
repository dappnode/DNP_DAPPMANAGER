const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const db = require("db");

const {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  isDnpUpdateAllowed,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  isCoreUpdateAllowed,
  getSettings,
  // String constants
  AUTO_UPDATE_SETTINGS
} = proxyquire("utils/autoUpdateHelper", {});

describe("Util: autoUpdateHelper", () => {
  beforeEach("Make sure the autosettings are restarted", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, {});
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });

  it("Should block all updates", async () => {
    const updates = [
      { name: "major", from: "0.2.0", to: "1.0.0", dnp: false, core: false },
      { name: "minor", from: "0.2.0", to: "0.3.0", dnp: false, core: false },
      { name: "patch", from: "0.2.0", to: "0.2.4", dnp: false, core: false }
    ];

    for (const { name, from, to, dnp } of updates) {
      expect(await isDnpUpdateAllowed(from, to)).to.equal(
        dnp,
        `wrong isAllowed for my packages ${name} update`
      );
    }

    for (const { name, from, to, core } of updates) {
      expect(await isCoreUpdateAllowed(from, to)).to.equal(
        core,
        `wrong isAllowed for system ${name} update`
      );
    }
  });

  it("Should set active for my packages", async () => {
    // Check that it's disabled
    expect(await isDnpUpdateEnabled()).to.equal(false);
    // Change setting
    await editDnpSetting(true);
    // Check that it's enabled
    expect(await isDnpUpdateEnabled()).to.equal(true);
  });

  it("Should set active for system packages", async () => {
    // Check that it's disabled
    expect(await isCoreUpdateEnabled()).to.equal(false);
    // Change setting
    await editCoreSetting(true);
    // Check that it's enabled
    expect(await isCoreUpdateEnabled()).to.equal(true);
  });

  it("Should validate updates when enabled", async () => {
    // Enable both types
    await editDnpSetting(true);
    await editCoreSetting(true);

    const updates = [
      { name: "major", from: "0.2.0", to: "1.0.0", dnp: false, core: false },
      { name: "minor", from: "0.2.0", to: "0.3.0", dnp: true, core: false },
      { name: "patch", from: "0.2.0", to: "0.2.4", dnp: true, core: true }
    ];

    for (const { name, from, to, dnp } of updates) {
      expect(await isDnpUpdateAllowed(from, to)).to.equal(
        dnp,
        `wrong isAllowed for ${name} update`
      );
    }

    for (const { name, from, to, core } of updates) {
      expect(await isCoreUpdateAllowed(from, to)).to.equal(
        core,
        `wrong isAllowed for ${name} update`
      );
    }
  });

  it("Should reset all setting", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, {});
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });
});
