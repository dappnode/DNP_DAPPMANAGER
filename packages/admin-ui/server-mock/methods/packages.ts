import {
  PackageEnvs,
  UserSettingsAllDnps,
  CoreUpdateData,
  DirectoryItem,
  RequestedDnp,
  PortMapping,
  InstalledPackageData,
  InstalledPackageDetailData
} from "../../src/common";
import * as eventBus from "../eventBus";
import { dnpInstalled, directory, dnpRequests } from "../data";
import { samplePackageContainer } from "../data/sample";
import { pause } from "../utils";

const pkgRestartMs = 2000;

const packages = new Map<string, InstalledPackageDetailData>(
  dnpInstalled.map(pkg => [pkg.name, pkg])
);

function update(
  id: string,
  fn: (pkg: InstalledPackageDetailData) => Partial<InstalledPackageDetailData>
) {
  const pkg = packages.get(id);
  if (!pkg) throw Error(`No id ${id}`);
  packages.set(id, { ...pkg, ...fn(pkg) });
  eventBus.requestPackages.emit();
}

/**
 * Return formated core update data
 */
export async function fetchCoreUpdateData(kwarg: {
  version?: string;
}): Promise<CoreUpdateData> {
  return {
    available: true,
    type: "patch",
    packages: [
      {
        name: "admin.dnp.dappnode.eth",
        from: "0.2.0",
        to: "0.2.6",
        warningOnInstall: "Warning on **install**"
      }
    ],
    changelog:
      "Major improvements to the 0.2 version https://github.com/dappnode/DAppNode/wiki/DAppNode-Migration-guide-to-OpenVPN",
    updateAlerts: [
      {
        from: "0.2.0",
        to: "0.2.0",
        message: "Conditional update alert: **Markdown**"
      }
    ],
    versionId: ""
  };
}

/**
 * Fetch directory summary
 */
export async function fetchDirectory(): Promise<DirectoryItem[]> {
  return directory;
}

/**
 * Fetch extended info about a new DNP
 */
export async function fetchDnpRequest({
  id
}: {
  id: string;
}): Promise<RequestedDnp> {
  const dnpRequest = dnpRequests[id];
  if (!dnpRequest) throw Error(`No dnp request found for ${id}`);
  return dnpRequest;
}

/**
 * Installs a DAppNode Package.
 * Resolves dependencies, downloads release assets, loads the images to docker,
 * sets userSettings and starts the docker container for each package.
 *
 * The logId is the requested id. It is used for the UI to track the progress
 * of the installation in real time and prevent double installs
 *
 * Options
 * - BYPASS_RESOLVER {bool}: Skips dappGet to only fetche first level dependencies
 * - BYPASS_CORE_RESTRICTION {bool}: Allows unverified core DNPs (from IPFS)
 */
export async function packageInstall({
  name,
  version
}: {
  name: string;
  version?: string;
  userSettings?: UserSettingsAllDnps;
  options?: {
    BYPASS_RESOLVER?: boolean;
    BYPASS_CORE_RESTRICTION?: boolean;
  };
}): Promise<void> {
  await pause(pkgRestartMs);
  packages.set(name, {
    ...samplePackageContainer,
    id: name,
    packageName: name,
    version: version || "0.1.0",
    image: `${name}:${version}`,
    name: name,
    shortName: name,
    avatarUrl: "http://ipfs.dappnode:8080/ipfs/Qm",
    origin: undefined,
    gettingStarted: `Welcome to the package **${name}**`,
    gettingStartedShow: true
  });
}

/**
 * Get package detail information
 */
export async function packageGet({
  id
}: {
  id: string;
}): Promise<InstalledPackageDetailData> {
  const pkg = packages.get(id);
  if (!pkg) throw Error(`${id} package not found`);
  return pkg;
}

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageData[]> {
  return Array.from(packages.values());
}

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageGettingStartedToggle({
  id,
  show
}: {
  id: string;
  show: boolean;
}): Promise<void> {
  update(id, () => ({ gettingStartedShow: show }));
}

/**
 * Returns the logs of the docker container of a package
 * @param id DNP .eth name
 * @param options log options
 * - timestamps: Show timestamps
 * - tail: Number of lines to return from bottom: 200
 * @returns String with escape codes
 */
export async function packageLog({
  id
}: {
  id: string;
  options?: { timestamps?: boolean; tail?: number };
}): Promise<string> {
  return `INFO: ${id} logs`;
}

/**
 * Remove a package and its data
 * @param id DNP .eth name
 * @param deleteVolumes flag to also clear permanent package data
 */
export async function packageRemove({
  id
}: {
  id: string;
  deleteVolumes?: boolean;
  timeout?: number;
}): Promise<void> {
  await pause(pkgRestartMs);
  packages.delete(id);
}

/**
 * Calls docker rm and docker up on a package
 */
export async function packageRestart({ id }: { id: string }): Promise<void> {
  await pause(pkgRestartMs);
  update(id, () => ({ state: "exited" }));

  await pause(pkgRestartMs);
  update(id, () => ({ state: "running" }));
}

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  id
}: {
  id: string;
  volumeId?: string;
}): Promise<void> {
  throw Error(`Not implemented: ${id}`);
}

/**
 * Updates the .env file of a package. If requested, also re-ups it
 * @param id DNP .eth name
 * @param envs environment variables, envs = { ENV_NAME: ENV_VALUE }
 */
export async function packageSetEnvironment({
  id,
  envs
}: {
  id: string;
  envs: PackageEnvs;
}): Promise<void> {
  await pause(pkgRestartMs);
  update(id, dnp => ({
    userSettings: {
      ...dnp.userSettings,
      environment: { ...(dnp.userSettings?.environment || {}), ...envs }
    }
  }));
}

/**
 * Updates the .env file of a package. If requested, also re-ups it
 * @param id DNP .eth name
 * @param envs environment variables, envs = { ENV_NAME: ENV_VALUE }
 */
export async function packageSetPortMappings({
  id,
  portMappings
}: {
  id: string;
  portMappings: PortMapping[];
  options?: { merge: boolean };
}): Promise<void> {
  await pause(pkgRestartMs);
  update(id, () => ({ ports: portMappings }));
}

/**
 * Stops or starts after fetching its status
 * @param id DNP .eth name
 * @param timeout seconds to stop the package
 */
export async function packageStartStop({
  id
}: {
  id: string;
  options?: { timeout?: number };
}): Promise<void> {
  await pause(pkgRestartMs);
  update(id, pkg => ({
    running: !pkg.running,
    state: pkg.running ? "exited" : "running"
  }));
}
