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
import domainAliasSet from "./domainAliasSet";
import ethClientTargetSet from "./ethClientTargetSet";
import fetchCoreUpdateData from "./fetchCoreUpdateData";
import fetchDirectory from "./fetchDirectory";
import fetchDnpRequest from "./fetchDnpRequest";
import getStats from "./getStats";
import getUserActionLogs from "./getUserActionLogs";
import installPackage from "./installPackage";
import installPackageSafe from "./installPackageSafe";
import listPackages from "./listPackages";
import logPackage from "./logPackage";
import managePorts from "./managePorts";
import mountpointsGet from "./mountpointsGet";
import notificationsGet from "./notificationsGet";
import notificationsRemove from "./notificationsRemove";
import notificationsTest from "./notificationsTest";
import packageDetailDataGet from "./packageDetailDataGet";
import packageGettingStartedToggle from "./packageGettingStartedToggle";
import passwordChange from "./passwordChange";
import passwordIsSecure from "./passwordIsSecure";
import poweroffHost from "./poweroffHost";
import rebootHost from "./rebootHost";
import removePackage from "./removePackage";
import requestChainData from "./requestChainData";
import resolveRequest from "./resolveRequest";
import restartPackage from "./restartPackage";
import restartPackageVolumes from "./restartPackageVolumes";
import seedPhraseSet from "./seedPhraseSet";
import setStaticIp from "./setStaticIp";
import systemInfoGet from "./systemInfoGet";
import togglePackage from "./togglePackage";
import updatePackageEnv from "./updatePackageEnv";
import updatePortMappings from "./updatePortMappings";
import volumeRemove from "./volumeRemove";
import volumesGet from "./volumesGet";

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
  domainAliasSet,
  ethClientTargetSet,
  fetchCoreUpdateData,
  fetchDirectory,
  fetchDnpRequest,
  getStats,
  getUserActionLogs,
  installPackage,
  installPackageSafe,
  listPackages,
  logPackage,
  managePorts,
  mountpointsGet,
  notificationsGet,
  notificationsRemove,
  notificationsTest,
  packageDetailDataGet,
  packageGettingStartedToggle,
  passwordChange,
  passwordIsSecure,
  poweroffHost,
  rebootHost,
  removePackage,
  requestChainData,
  resolveRequest,
  restartPackage,
  restartPackageVolumes,
  seedPhraseSet,
  setStaticIp,
  systemInfoGet,
  togglePackage,
  updatePackageEnv,
  updatePortMappings,
  volumeRemove,
  volumesGet
};
