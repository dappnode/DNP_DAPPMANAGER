import { listPackages } from "@dappnode/dockerapi";
// Internal
import { PackageRequest } from "../../types.js";
import dappGetBasic from "./basic.js";
import aggregate from "./aggregate/index.js";
import { DappGetFetcher } from "./fetch/index.js";
import resolve from "./resolve/index.js";
import shouldUpdate from "./utils/shouldUpdate.js";
import { logs } from "@dappnode/logger";
import { DappGetResult, DappGetDnps, DappGetState } from "./types.js";

export interface DappgetOptions {
  BYPASS_RESOLVER?: boolean;
}

/**
 * Aggregates all relevant packages and their info given a specific request.
 * The resulting "repo" (dnps) is run through a brute force resolver.
 * It returns success when finds the first compatible combination of versions.
 * Otherwise it will return an error formated object
 *
 * The criteria to qualify the "first" found combination is:
 * - The requested package has the highest version
 * - The already installed packages have the closest version to the current one
 * - Newly installed packages have the highest versions
 * This three conditions are prioritized as this list's order.
 *
 * @param req: The package request:
 * req = {
 *   name: 'nginx-proxy.dnp.dappnode.eth',
 *   ver: '^0.1.0',
 * }
 *
 * @returns Result object = {
 *   message: 'Found compatible state at case 1/256',
 *   state: {
 *     'ipfs.dnp.dappnode.eth': '0.1.3',
 *     'ethforward.dnp.dappnode.eth': '0.1.1',
 *     'vpn.dnp.dappnode.eth': '0.1.11',
 *     'wamp.dnp.dappnode.eth': '0.1.0',
 *     'admin.dnp.dappnode.eth': '0.1.6',
 *     'dappmanager.dnp.dappnode.eth': '0.1.10',
 *     'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1'
 *   },
 *   alreadyUpdated: {
 *     'bind.dnp.dappnode.eth': '0.1.4',
 *   }
 * }
 *
 * Or in case of error, throws and error with the message:
 *  'Could not find a compatible state. Packages x.dnp.dappnode.eth
 *   request incompatible versions of y.dnp.dappnode.eth.
 *   Checked 256/256 possible states.'
 * }
 */
export default async function dappGet(
  req: PackageRequest,
  options?: DappgetOptions,
  // For testing
  dappGetFetcher?: DappGetFetcher
): Promise<DappGetResult> {
  /**
   * If BYPASS_RESOLVER=true, use the dappGet basic.
   * It will not use the fetch or resolver module and only
   * fetch the first level dependencies of the request
   */
  if (options && options.BYPASS_RESOLVER) return await dappGetBasic(req);

  const dnpList = await listPackages();

  // Aggregate
  let dnps: DappGetDnps;
  try {
    // Minimal dependency injection (fetch). Proxyquire does not support subdependencies
    dnps = await aggregate({
      req,
      dnpList,
      dappGetFetcher: dappGetFetcher || new DappGetFetcher()
    });
  } catch (e) {
    logs.debug("dappGet/aggregate error", e);
    e.message = `dappGet could not resolve request ${req.name}@${req.ver}, error on aggregate stage: ${e.message}`;
    throw e;
  }

  // Resolve
  let result;
  try {
    result = resolve(dnps);
  } catch (e) {
    logs.debug("dappGet/resolve error", e);
    e.message = `dappGet could not resolve request ${req.name}@${req.ver}, error on resolve stage: ${e.message}`;
    throw e;
  }

  const { success, message, state } = result;
  // If the request could not be resolved, output a formated error:
  if (!success) throw Error(`Could not find compatible state. ${message}`);

  // Otherwise, format the output
  const alreadyUpdated: DappGetState = {};
  const currentVersions: DappGetState = {};
  for (const dnp of dnpList) {
    const prevVersion = dnp.version;
    const nextVersion = state[dnp.dnpName];
    if (nextVersion && !shouldUpdate(prevVersion, nextVersion)) {
      // DNP is already updated.
      // Remove from the success object and add it to the alreadyUpdatedd
      alreadyUpdated[dnp.dnpName] = state[dnp.dnpName];
      delete state[dnp.dnpName];
    }
    if (nextVersion) {
      currentVersions[dnp.dnpName] = prevVersion;
    }
  }

  return {
    message,
    state,
    alreadyUpdated,
    currentVersions
  };
}
