import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock/webpack";
import { EventBus, eventBus } from "@dappnode/eventbus"; // TODO: consider moving to @dappnode/eventbus
import { EthClientSyncedNotificationStatus } from "@dappnode/types";

describe.skip("modules / ethClient / emitSyncedNotification", () => {
  it("Simulate notification cycle for ethClient synced status", async () => {
    let notificationStatus: EthClientSyncedNotificationStatus = null;
    const ethClientSyncedNotificationStatus = {
      get: (): EthClientSyncedNotificationStatus => notificationStatus,
      set: (newValue: EthClientSyncedNotificationStatus): void => {
        notificationStatus = newValue;
      },
    };

    const notificationEmit = sinon.stub();
    const mockEventBus: EventBus = {
      ...eventBus,
      notification: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: (): void => {},
        emit: notificationEmit,
      },
    };

    const { emitSyncedNotification } = await rewiremock.around(
      () => import("../../../src/ethClient/syncedNotification.js"),
      (mock) => {
        mock(() => import("@dappnode/eventbus"))
          .with({ eventBus: mockEventBus })
          .toBeUsed();
        mock(() => import("@dappnode/db"))
          .with({ ethClientSyncedNotificationStatus })
          .toBeUsed();
      }
    );

    emitSyncedNotification(
      {
        execClient: "geth.dnp.dappnode.eth",
        consClient: "lighthouse.dnp.dappnode.eth",
      },
      { ok: false, code: "IS_SYNCING" }
    );
    expect(notificationEmit.callCount).to.equal(
      0,
      "Should not emit when syncing"
    );

    emitSyncedNotification(
      {
        execClient: "geth.dnp.dappnode.eth",
        consClient: "lighthouse.dnp.dappnode.eth",
      },
      { ok: true, url: "", dnpName: "" }
    );
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should emit when sync is complete"
    );

    emitSyncedNotification(
      {
        execClient: "geth.dnp.dappnode.eth",
        consClient: "lighthouse.dnp.dappnode.eth",
      },
      { ok: true, url: "", dnpName: "" }
    );
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should not emit again on complete"
    );

    emitSyncedNotification(
      {
        execClient: "geth.dnp.dappnode.eth",
        consClient: "lighthouse.dnp.dappnode.eth",
      },
      { ok: false, code: "IS_SYNCING" }
    );
    emitSyncedNotification(
      {
        execClient: "geth.dnp.dappnode.eth",
        consClient: "lighthouse.dnp.dappnode.eth",
      },
      { ok: true, url: "", dnpName: "" }
    );
    expect(notificationEmit.callCount).to.equal(
      1,
      "Should not emit again after synced"
    );

    emitSyncedNotification(
      {
        execClient: "nethermind.public.dappnode.eth",
        consClient: "nimbus.dnp.dappnode.eth",
      },
      { ok: false, code: "IS_SYNCING" }
    );
    emitSyncedNotification(
      {
        execClient: "nethermind.public.dappnode.eth",
        consClient: "nimbus.dnp.dappnode.eth",
      },
      { ok: true, url: "", dnpName: "" }
    );
    expect(notificationEmit.callCount).to.equal(
      2,
      "Should emit when changing target"
    );
  });
});
