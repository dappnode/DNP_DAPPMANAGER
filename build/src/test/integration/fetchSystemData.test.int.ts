import "mocha";
import { expect } from "chai";
import * as calls from "../../src/calls";
import Logs from "../../src/logs";
import { AutoUpdateSettings } from "../../src/types";
import { MY_PACKAGES, SYSTEM_PACKAGES } from "../../src/utils/autoUpdateHelper";
import { clearDbs } from "../testUtils";
const logs = Logs(module);

describe("Auto update data", () => {
  before(async () => {
    clearDbs();
  });

  const enabled = true;

  it("Should edit auto-update data", async () => {
    await calls.autoUpdateSettingsEdit({ id: MY_PACKAGES, enabled });
    await calls.autoUpdateSettingsEdit({ id: SYSTEM_PACKAGES, enabled });
  });

  it("Should retrieve modified auto-update data", async () => {
    const expectedSettings: AutoUpdateSettings = {
      [MY_PACKAGES]: { enabled },
      [SYSTEM_PACKAGES]: { enabled }
    };
    const {
      result: { settings }
    } = await calls.autoUpdateDataGet();
    expect(settings).to.deep.equal(expectedSettings);
  });
});

describe("Get system data", () => {
  before(async () => {
    clearDbs();
  });

  it("Should do and return a diagnose", async () => {
    const { result } = await calls.diagnose();
    expect(result).to.be.ok;
    // Only verify the version calls (docker, docker-compose)
    // that they actually returned a proper version
    for (const diagnose of result.filter(d => d.name.includes("version"))) {
      expect(diagnose.result).to.include(
        "version",
        `Diagnose of item ${diagnose.name} should include version`
      );
    }
  }).timeout(10 * 1000);

  it("Should get host machine stats", async () => {
    const { result } = await calls.getStats();
    expect(result).to.be.ok;
    // Can't check actual returns since they vary
    expect(result.cpu).to.include("%");
    expect(result.memory).to.include("%");
    expect(result.disk).to.include("%");
  }).timeout(10 * 1000);

  it("Should get DAPPMANAGER version data", async () => {
    const { result } = await calls.getVersionData();
    expect(result).to.be.ok;
    // Can't check return because is only exists on full build :(
  }).timeout(10 * 1000);

  it("Should getUserActionLogs", async () => {
    const { result } = await calls.getUserActionLogs({});
    // User logs should be empty since nothing happened that was registered
    expect(result).to.be.a("string");
  });
});

describe("Notifications", async () => {
  before("Should post a test notification", async () => {
    clearDbs();
    await calls.notificationsTest({});
  });

  let id: string;

  it("Should retrieve notifications", async () => {
    const { result } = await calls.notificationsGet();
    expect(result).to.have.length.greaterThan(
      0,
      "There should be one notification"
    );
    id = result[0].id;
  });

  it("Should remove a notification", async () => {
    if (!id) throw Error("Previous test failed");
    const {} = await calls.notificationsRemove({ ids: [id] });
    const { result } = await calls.notificationsGet();
    const deletedNotification = result.find(n => n.id === id);
    if (deletedNotification) {
      logs.info(JSON.stringify(result, null, 2));
      throw Error(`Notification id ${id} was not deleted`);
    }
  });
});

/**
 * PASSWORD MANAGMENT
 * [NOT-TESTED] Too obtrusive and destructive system calls, test on QA
 * - passwordChange
 * - passwordIsSecure
 */

/**
 * POWER MANAGMENT
 * [NOT-TESTED] Too obtrusive and destructive system calls, test on QA
 * - poweroffHost
 * - rebootHost
 */
