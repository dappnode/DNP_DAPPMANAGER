import * as eventBus from "../../eventBus";
import params from "../../params";
import * as db from "../../db";
import updateIp from "../../modules/dyndns/updateIp";
import lookup from "../../utils/lookup";
import getPublicIpFromUrls from "../../utils/getPublicIpFromUrls";
import Logs from "../../logs";
const logs = Logs(module);

const dyndnsInterval = params.DYNDNS_INTERVAL || 30 * 60 * 1000; // 30 minutes

/**
 * DynDNS interval check
 * If the static IP is not set, register and update the DynDNS registry
 *
 * Before doing so, it will check if it is actually necessary:
 * 1. Get its own IP and check if has changed from its internal DB record
 *    - If UPNP is available fetch the IP from there
 *    - Otherwise, fetch the IP from a centralized source
 * 2. Query the DynDNS and check if the record matches the server's IP
 *
 * If all queries were successful and all looks great skip update.
 * On any doubt, update the IP
 *
 * @returns {bool} should update
 */
async function shouldUpdate(): Promise<boolean> {
  try {
    const ipPrevious = db.publicIp.get();
    const ip = await getPublicIpFromUrls();
    // Store the IP on cache
    if (ip) db.publicIp.set(ip);
    // If there was an error fetching the IP or it change, update it
    if (!ip || ip !== ipPrevious) return true;

    /**
     * Check that the IP in the server is correct
     * - On the first run, this lookup will fail because the VPN has
     *   not registered itself yet to the DynDNS
     * - This check will detect if the DynDNS loses its DB because
     *   it was corrupted or some other problem
     */
    const domain: string = db.domain.get();
    const ipDyndns: string | null = await lookup(domain, true);
    // If there was an error fetching the IP or it change, update it
    if (!ipDyndns || ipDyndns !== ip) return true;

    // If all good, don't update
    return false;
  } catch (e) {
    // in case of error, should update
    logs.warn(`Error on shouldUpdate: ${e.stack}`);
    return true;
  }
}

/**
 * 2. Register to dyndns every interval
 * ====================================
 *
 * Watch for IP changes, if so update the IP. On error, asume the IP changed.
 * If the user has not defined a static IP use dynamic DNS
 * > staticIp is set in `initializeApp.js`
 *
 * DynDNS interval check
 * If the static is not defined, register and update the DynDNS registry
 *
 * Before doing so, it will check if it is actually necessary:
 * 1. Get its own IP and check if has changed from its internal DB record
 *    - If UPNP is available fetch the IP from there
 *    - Otherwise, fetch the IP from a centralized source
 * 2. Query the DynDNS and check if the record matches the server's IP
 *
 * [NOTE] On the first run the DNS lookup will fail and that will trigger the update
 *
 * If all queries were successful and all looks great skip update.
 * On any doubt, update the IP
 */

async function checkIpAndUpdateIfNecessary(): Promise<void> {
  try {
    const isStaticIpSet = Boolean(db.staticIp.get());
    if (isStaticIpSet) return;

    const ipShouldBeUpdated = Boolean(await shouldUpdate());
    if (ipShouldBeUpdated) await updateIp();
  } catch (e) {
    logs.error(`Error on dyndns interval: ${e.stack || e.message}`);
  }
}

/**
 * Dyndns watcher.
 */
export default function runWatcher(): void {
  setInterval(() => {
    checkIpAndUpdateIfNecessary();
  }, dyndnsInterval);

  eventBus.initializedDb.on(checkIpAndUpdateIfNecessary);
}
