import semver from "semver";
import params from "../../../params";
// Internal
import { safeSemver } from "../utils/safeSemver";
import aggregateDependencies from "./aggregateDependencies";
import getRelevantInstalledDnps from "./getRelevantInstalledDnps";
import { PackageRequest } from "../../../types";
import { DappGetDnps } from "../types";
import { logs } from "../../../logs";
import { DappGetFetcher } from "../fetch/DappGetFetcher";
import { setVersion } from "../utils/dnpUtils";
import {
  ErrorDappGetDowngrade,
  ErrorDappGetNotSatisfyRange,
  ErrorDappGetNoVersions
} from "../errors";
import { InstalledPackageData } from "@dappnode/common";

/**
 * Aggregates all relevant packages and their info given a specific request.
 * The resulting "repo" (dnps) can be run directly through a brute force resolver
 * as it only includes DNPs of interest to that specific user request
 *
 * @param req: The package request:
 * req = {
 *   name: 'nginx-proxy.dnp.dappnode.eth',
 *   ver: '^0.1.0',
 * }
 *
 * @returns dnps: Local repo of packages of interest that may be installed
 * They include the name of the package, their versions and dependencies and a tag:
 *   - isRequest
 *   - isInstalled
 * The tags are used latter to order the packages in order to
 * minimize the number of attempts to find a valid solutions
 * dnps = {
 *   'dependency.dnp.dappnode.eth': {
 *     versions: {
 *       '0.1.1': {},
 *       '0.1.2': {},
 *     },
 *   },
 *   'letsencrypt-nginx.dnp.dappnode.eth': {
 *     isInstalled: true,
 *     versions: {
 *       '0.0.4': { 'web.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 *   'nginx-proxy.dnp.dappnode.eth': {
 *     isRequest: true,
 *     versions: {
 *       '0.0.3': { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 *   'web.dnp.dappnode.eth': {
 *     isInstalled: true,
 *     versions: {
 *       '0.0.0': { 'letsencrypt-nginx.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 * };
 */
export default async function aggregate({
  req,
  dnpList,
  dappGetFetcher
}: {
  req: PackageRequest;
  dnpList: InstalledPackageData[];
  dappGetFetcher: DappGetFetcher;
}): Promise<DappGetDnps> {
  // Minimal dependency injection (fetch). Proxyquire does not support subdependencies
  const dnps: DappGetDnps = {};

  // WARNING: req is a user external input, must verify
  if (req.ver === "latest") req.ver = "*";

  await aggregateDependencies({
    name: req.name,
    versionRange: req.ver,
    dnps,
    dappGetFetcher // #### Injected dependency
  });

  const relevantInstalledDnps = getRelevantInstalledDnps({
    // requestedDnps = ["A", "B", "C"]
    requestedDnps: Object.keys(dnps),
    // Ignore invalid versions as: dnp.dnp.dappnode.eth:dev, :c5ashf61
    // Ignore 'core.dnp.dappnode.eth': it's dependencies are not real and its compatibility doesn't need to be guaranteed
    installedDnps: dnpList.filter(
      dnp => semver.valid(dnp.version) && dnp.dnpName !== params.coreDnpName
    )
  });
  // Add relevant installed dnps and their dependencies to the dnps object
  await Promise.all(
    relevantInstalledDnps.map(async ({ dnpName, version, origin, ...dnp }) => {
      try {
        if (origin) {
          // If package does not have an APM repo assume one single version
          // Use the cached dependencies stored in its container labels
          // Note: The IPFS hash MUST NOT be passed as a version or the package
          // will not be able to be updated
          setVersion(dnps, dnpName, version, dnp.dependencies);
        } else {
          await aggregateDependencies({
            name: dnpName,
            versionRange: `>=${version}`,
            dnps,
            dappGetFetcher // #### Injected dependency
          });
        }
      } catch (e) {
        logs.warn(`Error fetching installed dnp ${dnpName}`, e);
      }
    })
  );

  // Label dnps. They are used to order versions
  for (const dnpName in dnps) {
    const dnp = dnpList.find(dnp => dnp.dnpName === dnpName);

    // > Label isRequest + Enfore conditions:
    //   - requested DNP versions must match the provided versionRange
    if (dnpName === req.name) {
      dnps[dnpName].isRequest = true;
      for (const version in dnps[dnpName].versions) {
        if (!safeSemver.satisfies(version, req.ver)) {
          delete dnps[dnpName].versions[version];
        }
      }
      if (!Object.keys(dnps[dnpName].versions).length)
        throw new ErrorDappGetNotSatisfyRange(req);
    }
    // > Label isInstalled + Enfore conditions:
    //   - installed DNPs cannot be downgraded (don't apply this condition to the request)
    else if (dnp) {
      const dnpVersion = dnp.version;
      dnps[dnpName].isInstalled = true;
      for (const version in dnps[dnpName].versions) {
        if (
          // Exclusively apply this condition to semver versions.
          semver.valid(version) &&
          semver.valid(dnpVersion) &&
          // If the new version = "version" is strictly less than the current version "dnpVersion", ignore
          semver.lt(version, dnpVersion)
        )
          delete dnps[dnpName].versions[version];
      }
      if (!Object.keys(dnps[dnpName].versions).length)
        throw new ErrorDappGetDowngrade({ dnpName, dnpVersion });
    } else {
      // Validate aggregated dnps
      // - dnps must contain at least one version of the requested package
      if (!Object.keys(dnps[dnpName].versions).length) {
        logs.error("Faulty dnps object", req, dnps);
        throw new ErrorDappGetNoVersions({ dnpName, req });
      }
    }
  }

  return dnps;
}
