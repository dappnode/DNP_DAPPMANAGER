import { EventBus } from "../eventBus";
import { Routes, Subscriptions } from "@dappnode/common";

export function mapSubscriptionsToEventBus(
  subscriptions: Subscriptions,
  calls: Routes,
  eventBus: EventBus
): void {
  // Pipe local events to WAMP
  eventBus.logUi.on(subscriptions.progressLog.emit);
  eventBus.logUserAction.on(subscriptions.userActionLog.emit);
  eventBus.packages.on(subscriptions.packages.emit);
  eventBus.directory.on(subscriptions.directory.emit);
  eventBus.registry.on(subscriptions.registry.emit);

  // Emit the list of devices
  eventBus.requestDevices.on(async () => {
    subscriptions.devices.emit(await calls.devicesList());
  });

  // Emit the list of packages
  eventBus.requestPackages.on(async () => {
    subscriptions.packages.emit(await calls.packagesGet());
    subscriptions.volumes.emit(await calls.volumesGet());
  });

  // Emits the auto update data (settings, registry, pending)
  eventBus.requestAutoUpdateData.on(async () => {
    subscriptions.autoUpdateData.emit(await calls.autoUpdateDataGet());
  });

  // Emits all system info
  eventBus.requestSystemInfo.on(async () => {
    subscriptions.systemInfo.emit(await calls.systemInfoGet());
  });

  // Push notifications to the UI
  eventBus.notification.on(notification => {
    subscriptions.pushNotification.emit(notification);
  });

  /**
   * Initial calls when WAMP is active
   * - When the DAPPMANAGER starts, update the list of packages.
   *   The DAPPMANAGER may restart without the UI being restarted
   */
  eventBus.requestAutoUpdateData.emit();
  eventBus.requestPackages.emit();
}
