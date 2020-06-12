import {
  PackageEnvs,
  PackageContainer,
  UserSettingsAllDnps,
  PackageDetailData,
  CoreUpdateData,
  DirectoryItem,
  RequestedDnp
} from "../../src/common";
import {
  directory,
  dnpRequests,
  dnpInstalled,
  packagesDetailData
} from "../mockData";

const packages = new Map<string, PackageContainer>(
  dnpInstalled.map(pkg => [pkg.name, pkg])
);

function update(
  id: string,
  fn: (pkg: PackageContainer) => Partial<PackageContainer>
) {
  const pkg = packages.get(id);
  if (!pkg) throw Error(`No id ${id}`);
  packages.set(id, { ...pkg, ...fn(pkg) });
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
export async function installPackage({
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
  packages.set(name, {
    id: name,
    packageName: name,
    version: version || "0.1.0",
    isDnp: true,
    isCore: false,
    created: 12635125631,
    image: `${name}:${version}`,
    name: name,
    shortName: name,
    ip: "172.10.0.1",
    state: "running",
    running: true,
    envs: {},
    ports: [],
    volumes: [],
    defaultEnvironment: {},
    defaultPorts: [],
    defaultVolumes: [],
    dependencies: {},
    avatarUrl: "http://ipfs.dappnode:8080/ipfs/Qm",
    origin: undefined,
    // ### TODO: Move to PackageDetails, note it will require significant
    // changes to the ADMIN UI in parts the code is not yet typed
    // manifest?: Manifest;
    gettingStarted: `Welcome to the package **${name}**`,
    gettingStartedShow: true
  });
}

/**
 * Remove a package and its data
 * @param id DNP .eth name
 * @param deleteVolumes flag to also clear permanent package data
 */
export async function removePackage({
  id
}: {
  id: string;
  deleteVolumes?: boolean;
  timeout?: number;
}): Promise<void> {
  packages.delete(id);
}

/**
 * Calls docker rm and docker up on a package
 */
export async function restartPackage({ id }: { id: string }): Promise<void> {
  id;
}

/**
 * Removes a package volumes. The re-ups the package
 */
export async function restartPackageVolumes({
  id
}: {
  id: string;
  volumeId?: string;
}): Promise<void> {
  id;
}

/**
 * Stops or starts after fetching its status
 * @param id DNP .eth name
 * @param timeout seconds to stop the package
 */
export async function togglePackage({
  id
}: {
  id: string;
  options?: { timeout?: number };
}): Promise<void> {
  update(id, pkg => ({
    running: !pkg.running,
    state: pkg.running ? "exited" : "running"
  }));
}

/**
 * Updates the .env file of a package. If requested, also re-ups it
 * @param id DNP .eth name
 * @param envs environment variables, envs = { ENV_NAME: ENV_VALUE }
 */
export async function updatePackageEnv({
  id,
  envs
}: {
  id: string;
  envs: PackageEnvs;
}): Promise<void> {
  update(id, () => ({ envs }));
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
 * Returns the list of current containers associated to packages
 */
export async function listPackages(): Promise<PackageContainer[]> {
  return Array.from(packages.values());
}

/**
 * Get package detail information
 */
export async function packageDetailDataGet({
  id
}: {
  id: string;
}): Promise<PackageDetailData> {
  const packageDetailData = packagesDetailData[id];
  if (!packageDetailData) throw Error(`No detail data for ${id}`);
  return packageDetailData;
}

/**
 * Returns the logs of the docker container of a package
 * @param id DNP .eth name
 * @param options log options
 * - timestamps: Show timestamps
 * - tail: Number of lines to return from bottom: 200
 * @returns String with escape codes
 */
export async function logPackage({
  id
}: {
  id: string;
  options?: { timestamps?: boolean; tail?: number };
}): Promise<string> {
  return `INFO: ${id} logs`;
}
