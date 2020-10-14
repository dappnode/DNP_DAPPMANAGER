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
import { sampleContainer, sampleDnp } from "../data/sample";
import { pause } from "../utils";

const pkgRestartMs = 2000;

const packages = new Map<string, InstalledPackageDetailData>(
  dnpInstalled.map(dnp => [dnp.dnpName, dnp])
);

function update(
  dnpName: string,
  fn: (dnp: InstalledPackageDetailData) => Partial<InstalledPackageDetailData>
) {
  const dnp = packages.get(dnpName);
  if (!dnp) throw Error(`dnpName ${dnpName} not found`);
  packages.set(dnpName, { ...dnp, ...fn(dnp) });
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
  version,
  userSettings
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
    ...sampleDnp,
    dnpName: name,
    version: version || "0.1.0",
    avatarUrl: "http://ipfs.dappnode:8080/ipfs/Qm",
    origin: undefined,
    gettingStarted: `Welcome to the package **${name}**`,
    gettingStartedShow: true,
    userSettings: (userSettings || {})[name],
    containers: [
      {
        ...sampleContainer,
        containerName: `DAppNodePackage-${name}`,
        containerId: `00000000000${name}`,
        serviceName: name,
        instanceName: "",
        created: 1500000000,
        image: `${name}:${version}`,
        state: "running",
        running: true,
        ports: [],
        volumes: []
      }
    ]
  });
}

/**
 * Get package detail information
 */
export async function packageGet({
  dnpName
}: {
  dnpName: string;
}): Promise<InstalledPackageDetailData> {
  const dnp = packages.get(dnpName);
  if (!dnp) throw Error(`dnpName ${dnpName} not found`);
  return dnp;
}

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageData[]> {
  return Array.from(packages.values());
}

/**
 * Toggles the visibility of a getting started block
 */
export async function packageGettingStartedToggle({
  dnpName,
  show
}: {
  dnpName: string;
  show: boolean;
}): Promise<void> {
  update(dnpName, () => ({ gettingStartedShow: show }));
}

/**
 * Returns the logs of the docker container of a package
 * Log options
 * - timestamps: Show timestamps
 * - tail: Number of lines to return from bottom: 200
 * @returns String with escape codes
 */
export async function packageLog({
  containerName
}: {
  containerName: string;
  options?: { timestamps?: boolean; tail?: number };
}): Promise<string> {
  return `INFO: ${containerName} logs`;
}

/**
 * Remove a package and its data
 * deleteVolumes: flag to also clear permanent package data
 */
export async function packageRemove({
  dnpName
}: {
  dnpName: string;
  deleteVolumes?: boolean;
  timeout?: number;
}): Promise<void> {
  await pause(pkgRestartMs);
  packages.delete(dnpName);
}

/**
 * Calls docker rm and docker up on a package
 */
export async function packageRestart({
  dnpName
}: {
  dnpName: string;
}): Promise<void> {
  await pause(pkgRestartMs);
  update(dnpName, dnp => ({
    containers: dnp.containers.map(container => ({
      ...container,
      state: "exited"
    }))
  }));

  await pause(pkgRestartMs);
  update(dnpName, dnp => ({
    containers: dnp.containers.map(container => ({
      ...container,
      state: "running"
    }))
  }));
}

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  dnpName
}: {
  dnpName: string;
  volumeId?: string;
}): Promise<void> {
  throw Error(`Not implemented: ${dnpName}`);
}

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetEnvironment({
  dnpName,
  environmentByService
}: {
  dnpName: string;
  environmentByService: { [serviceName: string]: PackageEnvs };
}): Promise<void> {
  await pause(pkgRestartMs);

  for (const [serviceName, environment] of Object.entries(
    environmentByService
  )) {
    update(dnpName, dnp => ({
      userSettings: {
        ...dnp.userSettings,
        environment: {
          [serviceName]: {
            ...((dnp.userSettings?.environment || {})[serviceName] || {}),
            ...environment
          }
        }
      }
    }));
  }
}

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetPortMappings({
  dnpName,
  portMappingsByService
}: {
  dnpName: string;
  portMappingsByService: { [serviceName: string]: PortMapping[] };
  options?: { merge: boolean };
}): Promise<void> {
  await pause(pkgRestartMs);
  for (const [serviceName, portMappings] of Object.entries(
    portMappingsByService
  )) {
    update(dnpName, dnp => ({
      containers: dnp.containers.map(container =>
        container.serviceName === serviceName
          ? { ...container, ports: portMappings }
          : container
      )
    }));
  }
}

/**
 * Stops or starts after fetching its status
 */
export async function packageStartStop({
  dnpName,
  serviceNames
}: {
  dnpName: string;
  serviceNames?: string[];
}): Promise<void> {
  await pause(pkgRestartMs);
  const dnp = packages.get(dnpName);
  if (!dnp) throw Error(`dnpName ${dnpName} not found`);

  update(dnp.dnpName, d => ({
    containers: d.containers.map(container =>
      !serviceNames || serviceNames?.includes(container.serviceName)
        ? {
            ...container,
            running: !container.running,
            state: container.running ? "exited" : "running"
          }
        : container
    )
  }));
}
