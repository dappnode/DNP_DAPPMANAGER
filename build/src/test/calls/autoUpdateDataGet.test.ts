import "mocha";
import { expect } from "chai";
import { createTestDir, cleanTestDir } from "../testUtils";
import {
  editDnpSetting,
  editCoreSetting,
  isUpdateDelayCompleted,
  flagCompletedUpdate
} from "../../src/utils/autoUpdateHelper";
import * as db from "../../src/db";
import params from "../../src/params";

const proxyquire = require("proxyquire").noCallThru();

describe("Call function: autoUpdateDataGet", () => {
  const id = "bitcoin.dnp.dappnode.eth";
  const currentVersion = "0.2.6";
  const nextVersion = "0.2.7";
  const timestamp = Date.now() - 1000;

  const { default: autoUpdateDataGet } = proxyquire(
    "../../src/calls/autoUpdateDataGet",
    {
      "../modules/listContainers": async () => [
        { name: id, isDnp: true, version: currentVersion },
        { name: "admin", isCore: true, version: "0.2.1" },
        { name: "core", isCore: true, version: "0.2.1" },
        { name: "vpn", isCore: true, version: "0.2.0" }
      ]
    }
  );

  before(async () => {
    await createTestDir();
    db.clearDb();
    // Prepare results
    // Enable a few DNPs
    editCoreSetting(true);
    editDnpSetting(true);
    editDnpSetting(true, id);
    // Trigger some versions
    isUpdateDelayCompleted(id, nextVersion, timestamp);
    flagCompletedUpdate(
      "core.dnp.dappnode.eth",
      "admin@0.2.1,core@0.2.1",
      timestamp
    );
  });

  it("should return auto-update data", async () => {
    const res = await autoUpdateDataGet();

    expect(res).to.deep.equal({
      message: "Got auto update data",
      result: {
        settings: {
          "bitcoin.dnp.dappnode.eth": { enabled: true },
          "my-packages": { enabled: true },
          "system-packages": { enabled: true }
        },
        registry: {
          "core.dnp.dappnode.eth": {
            "admin@0.2.1,core@0.2.1": {
              successful: true,
              updated: timestamp
            }
          }
        },
        pending: {
          "bitcoin.dnp.dappnode.eth": {
            completedDelay: false,
            firstSeen: timestamp,
            scheduledUpdate: timestamp + params.AUTO_UPDATE_DELAY,
            version: nextVersion
          }
        },
        dnpsToShow: [
          {
            id: "system-packages",
            displayName: "System packages",
            enabled: true,
            feedback: { updated: timestamp }
          },
          {
            id: "my-packages",
            displayName: "My packages",
            enabled: true,
            feedback: {}
          },
          {
            id: id,
            displayName: "Bitcoin",
            enabled: true,
            feedback: { scheduled: timestamp + params.AUTO_UPDATE_DELAY }
          }
        ]
      }
    });
  });

  after(async () => {
    await cleanTestDir();
  });
});
