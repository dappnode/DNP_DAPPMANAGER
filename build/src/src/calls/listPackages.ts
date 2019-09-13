import * as eventBus from "../eventBus";
// Modules
import { listContainers } from "../modules/docker/listContainers";
import { dockerDf } from "../modules/docker/dockerApi";
// Utils
import parseDockerSystemDf from "../utils/parseDockerSystemDf";
import Logs from "../logs";
import { PackageContainer, RpcHandlerReturn } from "../types";
import { readConfigFiles } from "../utils/configFiles";
const logs = Logs(module);

// This call can fail because of:
//   Error response from daemon: a disk usage operation is already running
// Prevent running it twice
let isDockerSystemDfCallRunning = false;

interface RpcListPackagesReturn extends RpcHandlerReturn {
  result: PackageContainer[];
}

/**
 * Returns the list of current containers associated to packages
 *
 * @returns {array} dnpInstalled = [{
 *   id: "923852...", {string}
 *   packageName: "DAppNodePackage-admin...", {string}
 *   version: "0.1.8", {string}
 *   isDnp: true, {bool}
 *   isCore: false, {bool}
 *   created: <data string>, {string}
 *   image: "admin.dnp.dappnode.eth-0.1.8", {string}
 *   name: "admin.dnp.dappnode.eth", {string}
 *   shortName: "admin", {string}
 *   ports: [{
 *     host: 2222, {number}
 *     container: 3333, {number}
 *     protocol: "TCP" {string}
 *   }, ... ], {array}
 *   volumes: [{
 *     type: "bind", {string}
 *     name: "admin_data", {string}
 *     path: "source path" {string}
 *   }, ... ] {array}
 *   state: "running", {string}
 *   running: true, {bool}
 *
 *   // From labels
 *   origin: "/ipfs/Qmabcd...", {string}
 *   chain: "ethereum", {string}
 *   dependencies: { dependency.dnp.dappnode.eth: "0.1.8" }, {object}
 *   portsToClose: [ {portNumber: 30303, protocol: 'UDP'}, ...], {array}
 *
 *   // Appended here
 *   envs: { ENV_NAME: "ENV_VALUE" }, {object}
 *   manifest: <manifest object> {object}
 * }, ... ]
 */
export default async function listPackages(): Promise<RpcListPackagesReturn> {
  let dnpList = await listContainers();

  // Append envFile and manifest
  dnpList.map(dnp => {
    try {
      const { manifest, compose } = readConfigFiles(dnp.name, dnp.isCore);
      dnp.manifest = manifest;
      dnp.envs = compose.envs;
    } catch (e) {
      logs.warn(`Error appending ${(dnp || {}).name} files: ${e.message}`);
    }
  });

  // ##### EMIT data before appending system data
  eventBus.packages.emit(dnpList);

  // Append volume info
  // This call can fail because of:
  //   Error response from daemon: a disk usage operation is already running
  if (!isDockerSystemDfCallRunning)
    try {
      isDockerSystemDfCallRunning = true;
      const dockerSystemDfData = await dockerDf();
      dnpList = parseDockerSystemDf({ dockerSystemDfData, dnpList });
    } catch (e) {
      logs.error(`Error on listPackages, appending volume info: ${e.stack}`);
    } finally {
      isDockerSystemDfCallRunning = false;
    }

  return {
    message: `Listing ${dnpList.length} packages`,
    result: dnpList
  };
}
