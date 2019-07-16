const proxyquire = require("proxyquire");
const expect = require("chai").expect;

const autoUpdateHelper = proxyquire("utils/autoUpdateHelper", {});

// module.exports = {
//   isUpdateAllowed,
//   editDnpSettings,
//   editGeneralSettings,
//   resetDnpsSettings,
//   getSettings
// };

describe("Util: autoUpdateHelper", () => {
  before("Make sure the autosettings are restarted", async () => {
    await autoUpdateHelper.resetDnpsSettings();
    const autoUpdateSettings = await autoUpdateHelper.getSettings();
    expect(autoUpdateSettings).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });

  it("Should set the setting for one DNPs", async () => {
    const id = "bitcoin.dnp.dappnode.eth";
    const setting = "minor";

    await autoUpdateHelper.editDnpSettings(id, setting);
    const autoUpdateSettings = await autoUpdateHelper.getSettings();
    expect(autoUpdateSettings).to.deep.equal(
      { [id]: setting },
      "autoUpdateSettings are not empty"
    );
  });

  it("Should set the setting for all DNPs", async () => {
    const id = "bitcoin.dnp.dappnode.eth";
    const setting = "minor";

    await autoUpdateHelper.editGeneralSettings(setting);
    const autoUpdateSettings = await autoUpdateHelper.getSettings();
    expect(autoUpdateSettings).to.deep.equal(
      {
        "my-packages": setting,
        [id]: setting
      },
      "autoUpdateSettings are not empty"
    );
  });

  it("Should validate updates for a known DNP", async () => {
    const id = "bitcoin.dnp.dappnode.eth";

    expect(
      await autoUpdateHelper.isUpdateAllowed(id, "0.2.0", "1.0.0")
    ).to.equal(false, "Major update should NOT be enabled");
    expect(
      await autoUpdateHelper.isUpdateAllowed(id, "0.2.0", "0.3.0")
    ).to.equal(true, "Minor update should be enabled");
    expect(
      await autoUpdateHelper.isUpdateAllowed(id, "0.2.0", "0.2.4")
    ).to.equal(true, "Major update should be enabled");
  });

  it("Should validate updates for a another DNP", async () => {
    const otherId = "another.dnp.dappnode.eth";

    expect(
      await autoUpdateHelper.isUpdateAllowed(otherId, "0.2.0", "1.0.0")
    ).to.equal(false, "Major update should NOT be enabled");
    expect(
      await autoUpdateHelper.isUpdateAllowed(otherId, "0.2.0", "0.3.0")
    ).to.equal(true, "Minor update should be enabled");
    expect(
      await autoUpdateHelper.isUpdateAllowed(otherId, "0.2.0", "0.2.4")
    ).to.equal(true, "Major update should be enabled");
  });

  it("Should reset all setting", async () => {
    await autoUpdateHelper.resetDnpsSettings();
    const autoUpdateSettings = await autoUpdateHelper.getSettings();
    expect(autoUpdateSettings).to.deep.equal(
      {},
      "autoUpdateSettings are not empty"
    );
  });
});
