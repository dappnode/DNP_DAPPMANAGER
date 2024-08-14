import { listPackages } from "@dappnode/dockerapi";
import { shouldUpdate } from "@dappnode/utils";
// Internal
import { PackageRequest } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { DappGetResult, DappGetState } from "./types.js";
import { DappGetFetcher } from "./fetch/index.js";
import { DappnodeInstaller } from "../dappnodeInstaller.js";
import { filterSatisfiedDependencies } from "./utils/filterSatisfiedDependencies.js";
import { parseSemverRangeToVersion } from "./utils/parseSemverRangeToVersion.js";
import { get } from "http";

/**
 * Simple version of `dappGet`, since its resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If `BYPASS_RESOLVER == true`, fetch first level dependencies only
 */
export default async function dappGetBasic(
  dappnodeInstaller: DappnodeInstaller,
  req: PackageRequest
): Promise<DappGetResult> {
  const dappGetFetcher = new DappGetFetcher();

  const dependencies = await dappGetFetcher.dependencies(
    dappnodeInstaller,
    req.name,
    req.ver,
  );

  const { satisfiedDeps, nonSatisfiedDeps } = await filterSatisfiedDependencies(dependencies);

  const versionsToInstall = await parseSemverRangeToVersion(nonSatisfiedDeps, dappnodeInstaller);

  console.log("dappGet basic resolved first level dependencies", JSON.stringify(dependencies));

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...versionsToInstall,
    [req.name]: req.ver,
  };

  return {
    message: "dappGet basic resolved first level dependencies",
    state,
    alreadyUpdated: satisfiedDeps,
    currentVersions: await getCurrentVersions(),
  };
}

async function getCurrentVersions() {
  const dnpList = await listPackages();

  const currentVersions: DappGetState = {};

  dnpList.forEach((dnp) => {
    currentVersions[dnp.dnpName] = dnp.version;
  });

  return currentVersions;
}