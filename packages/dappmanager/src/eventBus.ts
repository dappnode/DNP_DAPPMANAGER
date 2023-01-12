import { EventEmitter } from "events";
import { logs } from "./logs";
import { mapValues } from "lodash-es";
import {
  ChainData,
  InstalledPackageData,
  ProgressLog,
  UserActionLog,
  PackageNotification,
  DirectoryItem
} from "@dappnode/common";

interface EventTypes {
  chainData: ChainData[];
  directory: DirectoryItem[];
  registry: DirectoryItem[];
  logUi: ProgressLog;
  logUserAction: UserActionLog;
  notification: PackageNotification;
  packages: InstalledPackageData[];
  packagesModified: { dnpNames: string[]; removed?: boolean };
  // Events without arguments
  telegramStatusChanged: void;
  initializedDb: void;
  requestAutoUpdateData: void;
  requestChainData: void;
  requestDevices: void;
  requestPackages: void;
  requestSystemInfo: void;
  runEthClientInstaller: { useCheckpointSync?: boolean };
  runNatRenewal: void;
  runStakerCacheUpdate: { dnpName: string };
}

const eventBusData: { [P in keyof EventTypes]: Record<string, never> } = {
  chainData: {},
  directory: {},
  registry: {},
  logUi: {},
  logUserAction: {},
  notification: {},
  packages: {},
  packagesModified: {},
  // Events without arguments
  telegramStatusChanged: {},
  initializedDb: {},
  requestAutoUpdateData: {},
  requestChainData: {},
  requestDevices: {},
  requestPackages: {},
  requestSystemInfo: {},
  runEthClientInstaller: {},
  runNatRenewal: {},
  runStakerCacheUpdate: {}
};

const eventEmitter = new EventEmitter();

type GetEventBus<T> = {
  [P in keyof T]: {
    on: (
      listener: T[P] extends void
        ? () => void | Promise<void>
        : (arg: T[P]) => void | Promise<void>
    ) => void;
    emit: T[P] extends void ? () => void : (arg: T[P]) => void;
  };
};

export type EventBus = GetEventBus<EventTypes>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventArg = any;

export const eventBus: EventBus = mapValues(eventBusData, (_, eventName) => ({
  on: (listener: (...args: EventArg[]) => void | Promise<void>): void => {
    eventEmitter.on(eventName, async (...args: EventArg[]) => {
      /**
       * Always run listeners within a try/catch block
       * Note: This syntax captures errors for sync and async listeners
       * Note: Error parsing `e.stack || e.message || e` is necessary
       * because there has been instances where the error captured
       * didn't had the stack property
       */
      try {
        await listener(...args);
      } catch (e) {
        logs.error(
          `Error on event '${eventName}': ${e.stack || e.message || e}`
        );
      }
    });
  },

  emit: (...args: EventArg[]): void => {
    eventEmitter.emit(eventName, ...args);
  }
}));
