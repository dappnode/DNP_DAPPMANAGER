import updateIp from "./updateIp";
import * as db from "../db";
const logs = require("../logs.js")(module);
import lookup from "../utils/lookup";
const getExternalUpnpIp = require("../utils/getExternalUpnpIp");
const getPublicIpFromUrls = require("../utils/getPublicIpFromUrls");

/**
 * DynDNS interval check
 * If the static is not defined, register and update the DynDNS registry
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
    const ipPrevious: string = await db.get("ip");
    let ip;
    const upnpAvailable: string = await db.get("upnpAvailable");
    if (upnpAvailable) ip = await getExternalUpnpIp();
    if (!ip) ip = await getPublicIpFromUrls();
    // Store the IP on cache
    if (ip) await db.set("ip", ip);
    // If there was an error fetching the IP or it change, update it
    if (!ip || ip !== ipPrevious) return true;

    /**
     * Check that the IP in the server is correct
     * - On the first run, this lookup will fail because the VPN has
     *   not registered itself yet to the DynDNS
     * - This check will detect if the DynDNS loses its DB because
     *   it was corrupted or some other problem
     */
    const domain: string = await db.get("domain");
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

export default async function checkIpAndUpdateIfNecessary() {
  if (await shouldUpdate()) {
    await updateIp();
  }
}
