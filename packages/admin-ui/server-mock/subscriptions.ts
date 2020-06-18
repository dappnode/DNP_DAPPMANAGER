import * as eventBus from "./eventBus";
import { Subscriptions } from "../src/common/subscriptions";
import * as calls from "./methods";

export function mapSubscriptionsToEventBus(subscriptions: Subscriptions): void {
  // Pipe local events to WAMP
  eventBus.chainData.on(subscriptions.chainData.emit);
  eventBus.logUi.on(subscriptions.progressLog.emit);
  eventBus.logUserAction.on(subscriptions.userActionLog.emit);
  eventBus.packages.on(subscriptions.packages.emit);
  eventBus.directory.on(subscriptions.directory.emit);

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

  // Store notification in DB and push it to the UI
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
