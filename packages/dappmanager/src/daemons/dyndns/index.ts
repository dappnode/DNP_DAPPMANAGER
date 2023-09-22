import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import * as db from "../../db/index.js";
import updateIp from "../../modules/dyndns/updateIp.js";
import lookup from "../../utils/lookup.js";
import getPublicIpFromUrls from "../../utils/getPublicIpFromUrls.js";
import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "../../utils/asyncFlows.js";

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
 * @returns should update
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
    logs.warn("Error on shouldUpdate", e);
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
    logs.error("Error on dyndns interval", e);
  }
}

/**
 * Dyndns daemon
 */
export function startDynDnsDaemon(signal: AbortSignal): void {
  eventBus.initializedDb.on(() => {
    checkIpAndUpdateIfNecessary();
  });

  runAtMostEvery(checkIpAndUpdateIfNecessary, params.DYNDNS_INTERVAL, signal);
}
