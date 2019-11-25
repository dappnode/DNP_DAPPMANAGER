import EventEmitter from "events";
import Logs from "./logs";
import {
  ChainData,
  PackageContainer,
  ProgressLog,
  UserActionLog,
  PackageNotification
} from "./types";
const logs = Logs(module);

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
 *
 * [NOTE] Error parsing `e.stack || e.message || e` is necessary because
 * there has been instances where the error captured didn't had the stack
 * property
 */

function eventBusOnSafe<T>(
  eventName: string,
  listener: (arg: T) => void
): void {
  eventBus.on(eventName, (arg: T) => {
    try {
      listener(arg);
    } catch (e) {
      logs.error(`Error on event '${eventName}': ${e.stack || e.message || e}`);
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
      logs.error(`Error on event '${eventName}': ${e.stack || e.message || e}`);
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
type PackageModifiedType = { ids: string[]; removed?: boolean };
export const packagesModified = busFactory<PackageModifiedType>(
  "PACKAGE_MODIFIED"
);
export const packages = busFactory<PackageContainer[]>("PACKAGES");
export const logUi = busFactory<ProgressLog>("LOGUI");
export const logUserAction = busFactory<UserActionLog>("LOG_USER_ACTION");
export const notification = busFactory<PackageNotification>("NOTIFICATION");

// Requests (without argument)
export const requestChainData = busFactoryNoArg("REQUEST_CHAIN_DATA");
export const requestAutoUpdateData = busFactoryNoArgAsync(
  "REQUEST_AUTO_UPDATE_DATA"
);
export const requestPackages = busFactoryNoArgAsync("REQUEST_PACKAGES");
export const runNatRenewal = busFactoryNoArg("RUN_NAT_RENEWAL");
export const initializedDb = busFactoryNoArg("INITIALIZED_DB");
