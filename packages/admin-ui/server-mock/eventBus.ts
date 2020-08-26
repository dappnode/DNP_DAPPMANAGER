import { EventEmitter } from "events";
import {
  ChainData,
  PackageContainer,
  ProgressLog,
  UserActionLog,
  PackageNotification,
  DirectoryItem
} from "../src/common/types";

/** HOW TO:
 * - ON:
 * eventBus.on(eventBusTag.logUi, (data) => {
 *   doStuff(data);
 * });
 *
 * - EMIT:
 * eventBus.emit(eventBusTag.logUi, data);
 */
class MyEmitter extends EventEmitter {}

const eventBus = new MyEmitter();

/**
 * Offer a default mechanism to run listeners within a try/catch block
 */

function eventBusOnSafe<T>(
  eventName: string,
  listener: (arg: T) => void
): void {
  eventBus.on(eventName, (arg: T) => {
    try {
      listener(arg);
    } catch (e) {
      console.error("Error on event", eventName, e);
    }
  });
}

function eventBusOnSafeAsync<T>(
  eventName: string,
  listener: (arg: T) => void
): void {
  eventBus.on(eventName, async (arg: T) => {
    try {
      await listener(arg);
    } catch (e) {
      console.error("Error on event", eventName, e);
    }
  });
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const busFactoryNoArgAsync = (event: string) => ({
  on: (listener: () => Promise<void>): void =>
    eventBusOnSafeAsync(event, listener),
  emit: (): void => {
    eventBus.emit(event);
  }
});
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const busFactoryNoArg = (event: string) => ({
  on: (listener: () => void): void => eventBusOnSafe(event, listener),
  emit: (): void => {
    eventBus.emit(event);
  }
});
// const busFactoryAsync = <T>(event: string) => ({
//   on: (listener: (arg: T) => Promise<void>) =>
//     eventBusOnSafeAsync<T>(event, listener),
//   emit: (arg: T): void => {
//     eventBus.emit(event, arg);
//   }
// });
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const busFactory = <T>(event: string) => ({
  on: (listener: (arg: T) => void): void => eventBusOnSafe<T>(event, listener),
  emit: (arg: T): void => {
    eventBus.emit(event, arg);
  }
});

//   call: "INTERNAL_CALL",

export const chainData = busFactory<ChainData[]>("CHAIN_DATAS");
type PackageModifiedType = { dnpNames: string[]; removed?: boolean };
export const packagesModified = busFactory<PackageModifiedType>(
  "PACKAGE_MODIFIED"
);
export const directory = busFactory<DirectoryItem[]>("DIRECTORY");
export const packages = busFactory<PackageContainer[]>("PACKAGES");
export const logUi = busFactory<ProgressLog>("LOGUI");
export const logUserAction = busFactory<UserActionLog>("LOG_USER_ACTION");
export const notification = busFactory<PackageNotification>("NOTIFICATION");

// Requests (without argument)
export const requestChainData = busFactoryNoArg("REQUEST_CHAIN_DATA");
export const requestAutoUpdateData = busFactoryNoArgAsync(
  "REQUEST_AUTO_UPDATE_DATA"
);
export const requestDevices = busFactoryNoArgAsync("REQUEST_DEVICES");
export const requestPackages = busFactoryNoArgAsync("REQUEST_PACKAGES");
export const requestSystemInfo = busFactoryNoArgAsync("REQUEST_SYSTEM_INFO");
export const runNatRenewal = busFactoryNoArg("RUN_NAT_RENEWAL");
export const initializedDb = busFactoryNoArg("INITIALIZED_DB");
export const runEthClientInstaller = busFactoryNoArg(
  "RUN_ETH_MULTI_CLIENT_WATCHER"
);
