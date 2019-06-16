const fetch = require("./fetch");
const aggregate = require("./aggregate");
const resolve = require("./resolve");
const dappGetBasic = require("./basic");
const docker = require("modules/docker");
const logs = require("logs.js")(module);
const shouldUpdate = require("./utils/shouldUpdate");

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
 * @param {object} req: The package request:
 * req = {
 *   name: 'nginx-proxy.dnp.dappnode.eth',
 *   ver: '^0.1.0',
 * }
 *
 * @returns {object} Result object = {
 *   message: 'Found compatible state at case 1/256',
 *   state: {
 *     'ipfs.dnp.dappnode.eth': '0.1.3',
 *     'ethchain.dnp.dappnode.eth': '0.1.4',
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
async function dappGet(req, options = {}) {
  /**
   * If BYPASS_RESOLVER=true, use the dappGet basic.
   * It will not use the fetch or resolver module and only
   * fetch the first level dependencies of the request
   */
  if (options.BYPASS_RESOLVER) return await dappGetBasic(req);

  const dnpList = await docker.getDnps();

  // Aggregate
  let dnps;
  try {
    // Minimal dependency injection (fetch). Proxyquire does not support subdependencies
    dnps = await aggregate({ req, dnpList, fetch });
  } catch (e) {
    logs.error(`dappGet/aggregate error: ${e.stack}`);
    e.message = `dappGet could not resolve request ${req.name}@${
      req.ver
    }, error on aggregate stage: ${e.message}`;
    throw e;
  }

  // Resolve
  let result;
  try {
    result = resolve(dnps);
  } catch (e) {
    logs.error(`dappGet/resolve error: ${e.stack}`);
    e.message = `dappGet could not resolve request ${req.name}@${
      req.ver
    }, error on resolve stage: ${e.message}`;
    throw e;
  }

  const { success, message, state } = result;
  // If the request could not be resolved, output a formated error:
  if (!success) throw Error(`Could not find compatible state. ${message}`);

  // Otherwise, format the output
  let alreadyUpdated = {};
  dnpList.forEach(dnp => {
    const currentVersion = dnp.version;
    const newVersion = state[dnp.name];
    if (newVersion && !shouldUpdate(currentVersion, newVersion)) {
      // DNP is already updated.
      // Remove from the success object and add it to the alreadyUpdatedd
      alreadyUpdated[dnp.name] = state[dnp.name];
      delete state[dnp.name];
    }
  });

  return {
    message,
    state,
    alreadyUpdated
  };
}

module.exports = dappGet;
