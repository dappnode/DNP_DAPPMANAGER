import "mocha";
import { expect } from "chai";
import {
  createTestDir,
  cleanTestDir,
  mockDnp,
  clearDbs
} from "../../testUtils";
import {
  editDnpSetting,
  editCoreSetting,
  isUpdateDelayCompleted,
  flagCompletedUpdate
} from "../../../src/utils/autoUpdateHelper";
import params from "../../../src/params";
import rewiremock from "rewiremock/webpack";
import { autoUpdateDataGet as autoUpdateDataGetType } from "../../../src/calls/autoUpdateDataGet";
import { InstalledPackageData } from "@dappnode/common";

describe.skip("Call function: autoUpdateDataGet", function () {
  this.timeout(5000);
  const dnpName = "bitcoin.dnp.dappnode.eth";
  const currentVersion = "0.2.6";
  const nextVersion = "0.2.7";
  const timestamp = Date.now() - 1000;

  async function listPackages(): Promise<InstalledPackageData[]> {
    return [
      {
        ...mockDnp,
        dnpName,
        isDnp: true,
        version: currentVersion
      },
      {
        ...mockDnp,
        dnpName: "admin.dnp.dappnode.eth",
        isDnp: false,
        isCore: true,
        version: "0.2.1"
      },
      {
        ...mockDnp,
        dnpName: "core.dnp.dappnode.eth",
        isDnp: false,
        isCore: true,
        version: "0.2.1"
      },
      {
        ...mockDnp,
        dnpName: "vpn.dnp.dappnode.eth",
        isDnp: false,
        isCore: true,
        version: "0.2.0"
      }
    ];
  }

  let autoUpdateDataGet: typeof autoUpdateDataGetType;

  beforeEach("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../src/calls/autoUpdateDataGet"),
      mock => {
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listPackages })
          .toBeUsed();
      }
    );
    autoUpdateDataGet = mock.autoUpdateDataGet;
  });

  before(async () => {
    await createTestDir();
    clearDbs();
    // Prepare results
    // Enable a few DNPs
    editCoreSetting(true);
    editDnpSetting(true);
    editDnpSetting(true, dnpName);
    // Trigger some versions
    isUpdateDelayCompleted(dnpName, nextVersion, timestamp);
    flagCompletedUpdate(
      "core.dnp.dappnode.eth",
      "admin@0.2.1,core@0.2.1",
      timestamp
    );
  });

  it("should return auto-update data", async () => {
    const res = await autoUpdateDataGet();

    expect(res).to.deep.equal({
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
          id: dnpName,
          displayName: "Bitcoin",
          enabled: true,
          feedback: { scheduled: timestamp + params.AUTO_UPDATE_DELAY }
        }
      ]
    });
  });

  after(async () => {
    await cleanTestDir();
  });
});
