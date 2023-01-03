import "mocha";
import { expect } from "chai";
import * as calls from "../../src/calls";
import { logs } from "../../src/logs";
import { AutoUpdateSettings } from "@dappnode/common";
import { MY_PACKAGES, SYSTEM_PACKAGES } from "../../src/utils/autoUpdateHelper";
import { clearDbs } from "../testUtils";

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
    const { settings } = await calls.autoUpdateDataGet();
    expect(settings).to.deep.equal(expectedSettings);
  });
});

describe("Get system data", () => {
  before(async () => {
    clearDbs();
  });

  it("Should return parsed disk stats from host machine", async () => {
    const result = await calls.statsDiskGet();
    expect(result).to.be.ok;
  }).timeout(10 * 1000);

  it("Should return parsed memory stats from host machine", async () => {
    const result = await calls.statsMemoryGet();
    expect(result).to.be.ok;
  }).timeout(10 * 1000);

  it("Should return parsed CPU stats from host machine", async () => {
    const result = await calls.statsCpuGet();
    expect(result).to.be.ok;
  }).timeout(10 * 1000);

  it("Should get DAPPMANAGER system info", async () => {
    await calls.systemInfoGet();
    // Can't check return because is only exists on full build :(
  }).timeout(10 * 1000);

  it("Should getUserActionLogs", async () => {
    const result = await calls.getUserActionLogs({});
    // User logs should be empty since nothing happened that was registered
    expect(result).to.be.a("array");
  });
});

// TODO: The subscription pushing notifications to the DB has been moved from
// the call code to the main index fail, breaking this test. This test should
// initialize the DAPPMANAGER as a whole so this logic is also tested
describe.skip("Notifications", async () => {
  before("Should post a test notification", async () => {
    clearDbs();
    await calls.notificationsTest({});
  });

  let id: string;

  it("Should retrieve notifications", async () => {
    const result = await calls.notificationsGet();
    expect(result).to.have.length.greaterThan(
      0,
      "There should be one notification"
    );
    id = result[0].id;
  });

  it("Should remove a notification", async () => {
    if (!id) throw Error("Previous test failed");
    await calls.notificationsRemove({ ids: [id] });
    const result = await calls.notificationsGet();
    const deletedNotification = result.find(n => n.id === id);
    if (deletedNotification) {
      logs.info("deletedNotification", result);
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
