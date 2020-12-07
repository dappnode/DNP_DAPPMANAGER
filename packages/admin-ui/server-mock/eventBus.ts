// Mock placeholder empty subscription object to allow compilation
const emptySubscription = { on: () => {}, emit: () => {} };

export const eventBus = {
  chainData: emptySubscription,
  packagesModified: emptySubscription,
  directory: emptySubscription,
  packages: emptySubscription,
  logUi: emptySubscription,
  logUserAction: emptySubscription,
  notification: emptySubscription,
  requestChainData: emptySubscription,
  requestAutoUpdateData: emptySubscription,
  requestDevices: emptySubscription,
  requestPackages: emptySubscription,
  requestSystemInfo: emptySubscription,
  runNatRenewal: emptySubscription,
  initializedDb: emptySubscription,
  runEthClientInstaller: emptySubscription
};
