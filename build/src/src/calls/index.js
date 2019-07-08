/**
 * Each call on this list will be automatically registered to WAMP
 * The key of the object property will be the call name as
 *     <key>.dappmanager.dnp.dappnode.eth
 */

module.exports = {
  backupGet: require("./backupGet"),
  backupRestore: require("./backupRestore"),
  changeIpfsTimeout: require("./changeIpfsTimeout"),
  cleanCache: require("./cleanCache"),
  copyFileFrom: require("./copyFileFrom"),
  copyFileTo: require("./copyFileTo"),
  diagnose: require("./diagnose"),
  diskSpaceAvailable: require("./diskSpaceAvailable"),
  fetchDirectory: require("./fetchDirectory"),
  fetchPackageVersions: require("./fetchPackageVersions"),
  fetchPackageData: require("./fetchPackageData"),
  getStats: require("./getStats"),
  getUserActionLogs: require("./getUserActionLogs"),
  getVersionData: require("./getVersionData"),
  installPackage: require("./installPackage"),
  installPackageSafe: require("./installPackageSafe"),
  listPackages: require("./listPackages"),
  logPackage: require("./logPackage"),
  managePorts: require("./managePorts"),
  notificationsGet: require("./notificationsGet"),
  notificationsRemove: require("./notificationsRemove"),
  notificationsTest: require("./notificationsTest"),
  passwordChange: require("./passwordChange"),
  passwordIsSecure: require("./passwordIsSecure"),
  removePackage: require("./removePackage"),
  requestChainData: require("./requestChainData"),
  resolveRequest: require("./resolveRequest"),
  restartPackage: require("./restartPackage"),
  restartPackageVolumes: require("./restartPackageVolumes"),
  togglePackage: require("./togglePackage"),
  updatePackageEnv: require("./updatePackageEnv")
};
