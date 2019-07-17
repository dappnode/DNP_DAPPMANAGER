const expect = require("chai").expect;
const db = require("db");

const {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  getSettings,
  // String constants
  AUTO_UPDATE_SETTINGS
} = require("utils/autoUpdateHelper");

const name = "bitcoin.dnp.dappnode.eth";

describe("Util: autoUpdateHelper", () => {
  beforeEach("Make sure the autosettings are restarted", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, {});
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

  after("Should reset all setting", async () => {
    await db.set(AUTO_UPDATE_SETTINGS, {});
    expect(await getSettings()).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });
});
