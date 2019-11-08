import semver from "semver";
import dappGet from "../modules/dappGet";
import getRelease from "../modules/release/getRelease";
import { listContainers } from "../modules/docker/listContainers";
import computeSemverUpdateType from "../utils/computeSemverUpdateType";
import { getCoreVersionId } from "../utils/coreVersionId";
import {
  Manifest,
  ManifestUpdateAlert,
  RpcHandlerReturnWithResult
} from "../types";

interface ReturnData {
  available: boolean;
  type?: string;
  packages: {
    name: string;
    from: string;
    to: string;
    warningOnInstall: string;
    manifest: Manifest;
  }[];
  changelog: string;
  updateAlerts: ManifestUpdateAlert[];
  versionId: string;
}

const coreName = "core.dnp.dappnode.eth";
const defaultVersion = "*";

/**
 * Fetches the core update data, if available
 *
 * @returns {object} result = {
 *   available: true {bool},
 *   type: "minor",
 *   packages: [
 *     {
 *       name: "core.dnp.dappnode.eth",
 *       from: "0.2.5",
 *       to: "0.2.6",
 *       manifest: {}
 *     },
 *     {
 *       name: "admin.dnp.dappnode.eth",
 *       from: "0.2.2",
 *       to: "0.2.3",
 *       manifest: {}
 *     }
 *   ],
 *   changelog: "Changelog text",
 *   updateAlerts: [{ message: "Specific update alert"}, ... ],
 *   versionId: "admin@0.2.6,core@0.2.8"
 * }
 */
export default async function fetchCoreUpdateData({
  version
}: {
  version?: string;
}): RpcHandlerReturnWithResult<ReturnData> {
  /**
   * Resolve core.dnp.dappnode.eth to figure out if it should be installed
   * With the list of deps to install, compute the higher updateType
   * - Check that all core DNPs to be updated have exactly an updateType of "patch"
   */
  const { state: coreDnpsToBeInstalled } = await dappGet({
    name: coreName,
    ver: version || defaultVersion
  });

  const dnpList = await listContainers();

  /**
   * If the core.dnp.dappnode.eth is not installed,
   * Ignore it to compute the update type
   */
  const coreDnp = dnpList.find(_dnp => _dnp.name === coreName);
  if (!coreDnp) delete coreDnpsToBeInstalled[coreName];

  const packages = await Promise.all(
    Object.entries(coreDnpsToBeInstalled).map(async ([depName, depVersion]) => {
      const dnp = dnpList.find(_dnp => _dnp.name === depName);
      const { metadata: depManifest } = await getRelease(depName, depVersion);
      return {
        name: depName,
        from: dnp ? dnp.version : "",
        to: depManifest.version,
        warningOnInstall:
          depManifest.warnings && depManifest.warnings.onInstall
            ? depManifest.warnings.onInstall
            : "",
        manifest: depManifest
      };
    })
  );

  /**
   * If there's no from version, it should be the max jump from "0.0.0",
   * from = "", to = "0.2.7": updateType = "minor"
   */
  const updateTypes = packages.map(({ from, to }) =>
    computeSemverUpdateType(from || "0.0.0", to)
  );

  const type = updateTypes.includes("major")
    ? "major"
    : updateTypes.includes("minor")
    ? "minor"
    : updateTypes.includes("patch")
    ? "patch"
    : undefined;

  const { metadata: coreManifest } = await getRelease(
    coreName,
    version || defaultVersion
  );

  /**
   * Compute updateAlerts
   */
  const dnpCore = dnpList.find(dnp => dnp.name === coreName);
  const from = dnpCore ? dnpCore.version : "";
  const to = coreManifest.version;
  const updateAlerts = (coreManifest.updateAlerts || []).filter(
    updateAlert =>
      semver.valid(from) &&
      semver.valid(to) &&
      updateAlert.message &&
      updateAlert.from &&
      semver.satisfies(from, updateAlert.from) &&
      semver.satisfies(to, updateAlert.to || "*")
  );

  // versionId = "admin@0.2.4,vpn@0.2.2,core@0.2.6"
  const versionId = getCoreVersionId(
    packages.map(({ name, to }) => ({ name, version: to }))
  );

  return {
    message: "Got core update data",
    result: {
      available: Boolean(Object.keys(coreDnpsToBeInstalled).length),
      type,
      packages,
      changelog: coreManifest.changelog || "",
      updateAlerts,
      versionId
    }
  };
}
