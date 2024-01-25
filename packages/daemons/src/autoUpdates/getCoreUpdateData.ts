import { valid, satisfies } from "semver";
import { params } from "@dappnode/params";
import { CoreUpdateData, PackageRelease } from "@dappnode/types";
import { listPackages } from "@dappnode/dockerapi";
import { getCoreVersionId, computeSemverUpdateType } from "@dappnode/utils";
import { DappnodeInstaller, ErrorDappGetDowngrade } from "@dappnode/installer";
import { logs } from "@dappnode/logger";

const coreName = params.coreDnpName;
const defaultVersion = "*";

/**
 * Fetches the core update data, if available
 */
export async function getCoreUpdateData(
  dappnodeInstaller: DappnodeInstaller,
  coreVersion: string = defaultVersion
): Promise<CoreUpdateData> {
  /**
   * Resolve core.dnp.dappnode.eth to figure out if it should be installed
   * With the list of deps to install, compute the higher updateType
   * - Check that all core DNPs to be updated have exactly an updateType of "patch"
   */

  let releases: PackageRelease[];
  try {
    const dappgetResult = await dappnodeInstaller.getReleasesResolved({
      name: coreName,
      ver: coreVersion,
    });
    releases = dappgetResult.releases;
  } catch (e) {
    if (e instanceof ErrorDappGetDowngrade) {
      logs.debug(
        `Core update to ${coreVersion} would cause a downgrade for ${e.dnpName} from ${e.dnpVersion}, assuming core is updated`
      );
      return { available: false };
    } else {
      throw e;
    }
  }

  if (releases.length === 0) {
    return { available: false };
  }

  const dnpList = await listPackages();

  /**
   * If the core.dnp.dappnode.eth is not installed,
   * Ignore it to compute the update type
   */
  const coreDnp = dnpList.find((_dnp) => _dnp.dnpName === coreName);
  const coreDnpsToBeInstalled = releases.filter(
    ({ dnpName }) => coreDnp || dnpName !== coreName
  );

  const packages = coreDnpsToBeInstalled.map((release) => {
    const dnp = dnpList.find((_dnp) => _dnp.dnpName === release.dnpName);
    const { manifest: depManifest } = release;
    return {
      name: release.dnpName,
      from: dnp ? dnp.version : undefined,
      to: depManifest.version,
      warningOnInstall:
        depManifest.warnings && depManifest.warnings.onInstall
          ? depManifest.warnings.onInstall
          : undefined,
    };
  });

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

  /**
   * Compute updateAlerts
   */
  const coreRelease =
    releases.find(({ dnpName }) => dnpName === coreName) ||
    (await dappnodeInstaller.getRelease(coreName, coreVersion));
  const { manifest: coreManifest } = coreRelease;
  const dnpCore = dnpList.find((dnp) => dnp.dnpName === coreName);
  const from = dnpCore ? dnpCore.version : "";
  const to = coreManifest.version;
  const updateAlerts = (coreManifest.updateAlerts || []).filter(
    (updateAlert) =>
      valid(from) &&
      valid(to) &&
      updateAlert.message &&
      updateAlert.from &&
      satisfies(from, updateAlert.from) &&
      satisfies(to, updateAlert.to || "*")
  );

  // versionId = "admin@0.2.4,vpn@0.2.2,core@0.2.6"
  const versionId = getCoreVersionId(
    packages.map(({ name, to }) => ({ dnpName: name, version: to }))
  );

  return {
    available: coreDnpsToBeInstalled.length > 0,
    type,
    packages,
    changelog: coreManifest.changelog || "",
    updateAlerts,
    versionId,
    coreVersion: coreManifest.version,
  };
}
