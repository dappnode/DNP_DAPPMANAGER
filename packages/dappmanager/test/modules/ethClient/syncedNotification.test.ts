import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock";
import { EthClientSyncedNotificationStatus } from "../../../src/types";
import { EventBus, eventBus } from "../../../src/eventBus";

describe("modules / ethClient / emitSyncedNotification", () => {
  it("Simulate notification cycle for ethClient synced status", async () => {
    let notificationStatus: EthClientSyncedNotificationStatus = null;
    const ethClientSyncedNotificationStatus = {
      get: (): EthClientSyncedNotificationStatus => notificationStatus,
      set: (newValue: EthClientSyncedNotificationStatus): void => {
        notificationStatus = newValue;
      }
    };

    const notificationEmit = sinon.stub();
    const mockEventBus: EventBus = {
      ...eventBus,
      notification: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: (): void => {},
        emit: notificationEmit
      }
    };

    const { emitSyncedNotification } = await rewiremock.around(
      () => import("../../../src/modules/ethClient/syncedNotification"),
      mock => {
        mock(() => import("../../../src/eventBus"))
          .with({ eventBus: mockEventBus })
          .toBeUsed();
        mock(() => import("../../../src/db"))
          .with({ ethClientSyncedNotificationStatus })
          .toBeUsed();
      }
    );

    emitSyncedNotification("geth", { ok: false, code: "IS_SYNCING" });
    expect(notificationEmit.callCount).to.equal(
      0,
      "Should not emit when syncing"
    );

    emitSyncedNotification("geth", { ok: true, url: "", dnpName: "" });
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should emit when sync is complete"
    );

    emitSyncedNotification("geth", { ok: true, url: "", dnpName: "" });
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should not emit again on complete"
    );

    emitSyncedNotification("geth", { ok: false, code: "IS_SYNCING" });
    emitSyncedNotification("geth", { ok: true, url: "", dnpName: "" });
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should not emit again after synced"
    );

    emitSyncedNotification("nethermind", { ok: false, code: "IS_SYNCING" });
    emitSyncedNotification("nethermind", { ok: true, url: "", dnpName: "" });
    expect(notificationEmit.callCount).to.equal(
      2,
      "Should emit when changing target"
    );
  });
});
