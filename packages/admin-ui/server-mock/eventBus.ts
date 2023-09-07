import { EventBus } from "@dappnode/dappmanager/src/eventBus";

// Mock placeholder empty subscription object to allow compilation
const emptySubscription = { on: () => {}, emit: () => {} };

export const eventBus: EventBus = {
  chainData: emptySubscription,
  directory: emptySubscription,
  registry: emptySubscription,
  logUi: emptySubscription,
  logUserAction: emptySubscription,
  notification: emptySubscription,
  packages: emptySubscription,
  packagesModified: emptySubscription,
  telegramStatusChanged: emptySubscription,

  // Events without arguments
  initializedDb: emptySubscription,
  requestAutoUpdateData: emptySubscription,
  requestChainData: emptySubscription,
  requestDevices: emptySubscription,
  requestPackages: emptySubscription,
  requestSystemInfo: emptySubscription,
  runEthClientInstaller: emptySubscription,
  runEthicalMetricsInstaller: emptySubscription,
  runNatRenewal: emptySubscription,
  runStakerCacheUpdate: emptySubscription
};
