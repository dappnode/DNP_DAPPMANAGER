/**
 * Each call on this list will be automatically registered to WAMP
 * The key of the object property will be the call name as
 *     <key>.dappmanager.dnp.dappnode.eth
 */

import autoUpdateDataGet from "./autoUpdateDataGet";
import autoUpdateSettingsEdit from "./autoUpdateSettingsEdit";
import backupGet from "./backupGet";
import backupRestore from "./backupRestore";
import changeIpfsTimeout from "./changeIpfsTimeout";
import cleanCache from "./cleanCache";
import copyFileFrom from "./copyFileFrom";
import copyFileTo from "./copyFileTo";
import diagnose from "./diagnose";
import fetchCoreUpdateData from "./fetchCoreUpdateData";
import fetchDirectory from "./fetchDirectory";
import fetchPackageData from "./fetchPackageData";
import getStats from "./getStats";
import getUserActionLogs from "./getUserActionLogs";
import getVersionData from "./getVersionData";
import installPackage from "./installPackage";
import installPackageSafe from "./installPackageSafe";
import listPackages from "./listPackages";
import logPackage from "./logPackage";
import managePorts from "./managePorts";
import notificationsGet from "./notificationsGet";
import notificationsRemove from "./notificationsRemove";
import notificationsTest from "./notificationsTest";
import passwordChange from "./passwordChange";
import passwordIsSecure from "./passwordIsSecure";
import poweroffHost from "./poweroffHost";
import rebootHost from "./rebootHost";
import removePackage from "./removePackage";
import requestChainData from "./requestChainData";
import resolveRequest from "./resolveRequest";
import restartPackage from "./restartPackage";
import restartPackageVolumes from "./restartPackageVolumes";
import togglePackage from "./togglePackage";
import updatePackageEnv from "./updatePackageEnv";
import updatePortMappings from "./updatePortMappings";

export {
  autoUpdateDataGet,
  autoUpdateSettingsEdit,
  backupGet,
  backupRestore,
  changeIpfsTimeout,
  cleanCache,
  copyFileFrom,
  copyFileTo,
  diagnose,
  fetchCoreUpdateData,
  fetchDirectory,
  fetchPackageData,
  getStats,
  getUserActionLogs,
  getVersionData,
  installPackage,
  installPackageSafe,
  listPackages,
  logPackage,
  managePorts,
  notificationsGet,
  notificationsRemove,
  notificationsTest,
  passwordChange,
  passwordIsSecure,
  poweroffHost,
  rebootHost,
  removePackage,
  requestChainData,
  resolveRequest,
  restartPackage,
  restartPackageVolumes,
  togglePackage,
  updatePackageEnv,
  updatePortMappings
};
